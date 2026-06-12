import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map lookup keys to tier names. Falls back to subscription metadata.tier when lookup_key absent.
const TIER_BY_LOOKUP: Record<string, string> = {
  silver_monthly: "silver",
  gold_monthly: "gold",
  platinum_monthly: "platinum",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");

    let environment: unknown = undefined;
    try {
      const body = await req.json();
      environment = body?.environment;
    } catch (_) { /* no body */ }
    const env = resolveEnv(environment);

    const stripe = createStripeClient(env);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    let subscribed = false;
    let tier: string | null = null;
    let priceId: string | null = null;
    let customerId: string | null = null;
    let subscriptionId: string | null = null;
    let periodEnd: string | null = null;
    let status: string | null = null;
    let trialEnd: string | null = null;

    if (customers.data.length) {
      customerId = customers.data[0].id;
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
      const live = subs.data.find((s) => s.status === "active" || s.status === "trialing");
      if (live) {
        subscribed = true;
        subscriptionId = live.id;
        const item = live.items.data[0];
        priceId = item.price.id;
        const lookupKey = (item.price as any).lookup_key as string | undefined;
        tier = (lookupKey && TIER_BY_LOOKUP[lookupKey]) || (live.metadata?.tier as string) || null;
        periodEnd = new Date((live as any).current_period_end * 1000).toISOString();
        status = live.status;
        trialEnd = live.trial_end ? new Date(live.trial_end * 1000).toISOString() : null;
      }
    }

    // Check previous state to detect activation transition
    const { data: prevSub } = await admin
      .from("subscriptions")
      .select("subscribed, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    await admin.from("subscriptions").upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscribed,
      tier,
      price_id: priceId,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Fire activation email on first transition false -> true OR new billing period
    if (subscribed && tier && (!prevSub?.subscribed || prevSub?.current_period_end !== periodEnd)) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "subscription-activated",
            recipientEmail: user.email,
            idempotencyKey: `sub-active-${user.id}-${periodEnd ?? "none"}`,
            templateData: {
              name: (user.user_metadata as any)?.display_name,
              tier,
              dashboardUrl: "https://booksuite.online/dashboard",
            },
          },
        });
      } catch (e) { console.error("activation email failed", e); }
    }

    return new Response(JSON.stringify({ subscribed, tier, current_period_end: periodEnd, status, trial_end: trialEnd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
