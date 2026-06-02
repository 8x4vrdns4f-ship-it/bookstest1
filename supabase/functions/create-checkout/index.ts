import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_IDS: Record<string, string> = {
  silver: "price_1TInwDFXQZu4XzM9fqghpFl5",
  gold: "price_1TInx0FXQZu4XzM9J8VzF7aP",
  platinum: "price_1TIpE2FXQZu4XzM9eAyvflcc",
};

const TRIAL_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tier, mode = "paid" } = await req.json();
    const priceId = PRICE_IDS[tier];
    if (!priceId) throw new Error("Invalid tier");
    const wantsTrial = mode === "trial";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-08-27.basil" });

    // --- Trial eligibility (only matters if mode === "trial") ---
    // Once a user has cancelled (or ever had any subscription), no more free trials.
    let eligibleForTrial = wantsTrial;

    if (wantsTrial) {
      const { data: priorRows } = await admin
        .from("subscriptions")
        .select("id, canceled_at")
        .eq("user_id", user.id)
        .limit(1);
      if (priorRows && priorRows.length > 0) eligibleForTrial = false;
    }

    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = existing.data[0]?.id;

    if (wantsTrial && eligibleForTrial && customerId) {
      const allSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 1,
      });
      if (allSubs.data.length > 0) eligibleForTrial = false;
    }

    if (wantsTrial && !eligibleForTrial) {
      throw new Error("You're not eligible for a free trial. You can still subscribe at the regular price.");
    }

    const origin = req.headers.get("origin") || "https://booksuite.online";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      payment_method_collection: "always",
      success_url: `${origin}/dashboard?subscribed=1`,
      cancel_url: `${origin}/pricing`,
      subscription_data: {
        metadata: { user_id: user.id, tier },
        ...(wantsTrial ? { trial_period_days: TRIAL_DAYS } : {}),
      },
    });

    return new Response(JSON.stringify({ url: session.url, trial: wantsTrial }), {
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
