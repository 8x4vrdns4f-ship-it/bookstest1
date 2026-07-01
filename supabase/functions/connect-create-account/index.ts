import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv, sanitizeOrigin } from "../_shared/stripe.ts";

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

    const body = await req.json().catch(() => ({}));
    const env = resolveEnv(body.environment);
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
      .eq("environment", env)
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

    const origin = sanitizeOrigin(body.origin || req.headers.get("origin"), "https://booksuite.online");

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/payments/refresh`,
      return_url: `${origin}/payments/return`,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: link.url, account_id: accountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("connect-create-account error", e);
    const stripeMsg = e?.raw?.message || e?.message || String(e);
    const isStripe = e?.type?.toString?.().startsWith("Stripe") || !!e?.raw;
    const hint = /platform-profile|managing losses|responsibilities/i.test(stripeMsg)
      ? " (Platform setup required: complete the Connect platform profile in your Stripe dashboard — Settings → Connect → Platform profile, in Live mode.)"
      : "";
    const message = (isStripe ? `Stripe: ${stripeMsg}` : stripeMsg) + hint;
    return new Response(JSON.stringify({ error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
