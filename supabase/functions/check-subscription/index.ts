import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_BY_PRICE: Record<string, string> = {
  price_1TInwDFXQZu4XzM9fqghpFl5: "silver",
  price_1TInx0FXQZu4XzM9J8VzF7aP: "gold",
  price_1TIpE2FXQZu4XzM9eAyvflcc: "platinum",
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-08-27.basil" });
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
      // Pick the most recent active OR trialing subscription.
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
      const live = subs.data.find((s) => s.status === "active" || s.status === "trialing");
      if (live) {
        subscribed = true;
        subscriptionId = live.id;
        priceId = live.items.data[0].price.id;
        tier = TIER_BY_PRICE[priceId] ?? null;
        periodEnd = new Date(live.current_period_end * 1000).toISOString();
        status = live.status;
        trialEnd = live.trial_end ? new Date(live.trial_end * 1000).toISOString() : null;
      }
    }

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
