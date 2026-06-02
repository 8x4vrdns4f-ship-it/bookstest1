import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RETENTION_COUPON_ID = "AOj67s4B"; // 10% off forever

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const anon = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: userData } = await anon.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // One-time retention offer per user.
    const { data: sub } = await admin
      .from("subscriptions").select("retention_offer_used").eq("user_id", user.id).maybeSingle();
    if (sub?.retention_offer_used) {
      throw new Error("Retention discount has already been applied to your account.");
    }

    let environment: unknown = undefined;
    try { const body = await req.json(); environment = body?.environment; } catch (_) {}
    const stripe = createStripeClient(resolveEnv(environment));
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    if (!customerId) throw new Error("No Stripe customer found");

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    const live = subs.data.find((s) => s.status === "active" || s.status === "trialing");
    if (!live) throw new Error("No active subscription to discount");

    // Apply the 10%-forever coupon
    await stripe.subscriptions.update(live.id, { coupon: RETENTION_COUPON_ID });

    await admin.from("subscriptions").update({
      retention_offer_used: true,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    return new Response(JSON.stringify({ ok: true }), {
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
