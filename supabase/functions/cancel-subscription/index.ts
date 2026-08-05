import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";
import { notifyAdmin, money } from "../_shared/notify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WINBACK_COUPON_ID = "FWV5BZBe"; // 20% off, 3 months
const WINBACK_CODE_LABEL = "COMEBACK20";

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

    let environment: unknown = undefined;
    try {
      const body = await req.json();
      environment = body?.environment;
    } catch (_) { /* no body */ }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Look up current subscription row
    const { data: subRow } = await admin
      .from("subscriptions")
      .select("tier, price_id, stripe_subscription_id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: biz } = await admin.from("business_settings")
      .select("business_name").eq("user_id", user.id).maybeSingle();

    // Gift/manual subscription path — no Stripe involvement.
    const isGift = !subRow?.stripe_subscription_id ||
      (typeof subRow?.price_id === "string" && subRow.price_id.startsWith("gift_"));

    if (isGift) {
      const tier = subRow?.tier ?? "your plan";
      await admin.from("subscriptions").upsert({
        user_id: user.id,
        email: user.email,
        subscribed: false,
        status: "canceled",
        tier,
        canceled_at: new Date().toISOString(),
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "subscription-canceled",
            recipientEmail: user.email,
            templateData: {
              businessName: biz?.business_name || user.email,
              tier: String(tier).charAt(0).toUpperCase() + String(tier).slice(1),
              winbackCode: "",
              resubscribeUrl: "https://booksuite.online/pricing",
            },
            idempotencyKey: `cancel-gift-${user.id}-${Date.now()}`,
          },
        });
      } catch (mailErr) {
        console.error("[cancel-subscription] gift email send failed", mailErr);
      }

      await notifyAdmin(admin, {
        eventTitle: "Subscription cancelled (gifted plan)",
        businessName: biz?.business_name || user.email || "",
        rows: [
          { label: "Account", value: user.email || user.id },
          { label: "Plan", value: String(tier) },
        ],
        idempotencyKey: `cancel-gift-${user.id}-${new Date().toISOString().slice(0, 10)}`,
      });

      return new Response(JSON.stringify({ ok: true, giftCanceled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Paid Stripe path
    const env = resolveEnv(environment);
    const stripe = createStripeClient(env);

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    if (!customerId) throw new Error("No Stripe customer found");

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    const live = subs.data.find((s) => s.status === "active" || s.status === "trialing" || s.status === "past_due");
    if (!live) throw new Error("No active subscription to cancel");

    const canceled = await stripe.subscriptions.cancel(live.id, { invoice_now: false, prorate: false });
    const tier = (canceled.metadata?.tier as string) || subRow?.tier || "your plan";

    await admin.from("subscriptions").upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      stripe_subscription_id: live.id,
      subscribed: false,
      status: "canceled",
      tier,
      canceled_at: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "subscription-canceled",
          recipientEmail: user.email,
          templateData: {
            businessName: biz?.business_name || user.email,
            tier: tier.charAt(0).toUpperCase() + tier.slice(1),
            winbackCode: WINBACK_CODE_LABEL,
            resubscribeUrl: "https://booksuite.online/pricing",
          },
          idempotencyKey: `cancel-${live.id}`,
        },
      });
    } catch (mailErr) {
      console.error("[cancel-subscription] email send failed", mailErr);
    }

    await notifyAdmin(admin, {
      eventTitle: "Subscription cancelled",
      businessName: biz?.business_name || user.email || "",
      rows: [
        { label: "Account", value: user.email || user.id },
        { label: "Plan", value: String(tier) },
      ],
      idempotencyKey: `cancel-${live.id}`,
    });

    return new Response(JSON.stringify({ ok: true, winbackCouponId: WINBACK_COUPON_ID }), {
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
