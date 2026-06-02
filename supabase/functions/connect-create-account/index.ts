import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !userData.user) throw new Error("Unauthorized");
    const user = userData.user;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const env = resolveEnv(undefined);
    const stripe = createStripeClient(env);

    // Get business settings for country / business name
    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, currency, business_email")
      .eq("user_id", user.id)
      .maybeSingle();

    // Reuse existing connect account if any
    const { data: existing } = await admin
      .from("connect_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let accountId = existing?.stripe_account_id;

    if (!accountId) {
      const country = (settings?.currency === "USD" ? "US" : settings?.currency === "EUR" ? "IE" : "GB");
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: settings?.business_email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: settings?.business_name || undefined,
        },
        metadata: { user_id: user.id },
      });
      accountId = account.id;

      await admin.from("connect_accounts").insert({
        user_id: user.id,
        stripe_account_id: accountId,
        country,
        default_currency: (settings?.currency || "GBP").toLowerCase(),
        environment: env,
      });
    }

    const body = await req.json().catch(() => ({}));
    const origin = body.origin || req.headers.get("origin") || "https://booksuite.online";

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/payments/refresh`,
      return_url: `${origin}/payments/return`,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: link.url, account_id: accountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("connect-create-account error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
