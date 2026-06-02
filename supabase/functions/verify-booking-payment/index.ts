// PUBLIC endpoint — called by the post-checkout success page.
// Verifies payment with Stripe and promotes pending_booking -> bookings.
// Idempotent: safe to call multiple times.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Already promoted?
    const { data: existing } = await admin
      .from("bookings")
      .select("id, confirmation_code, status, payment_status")
      .eq("stripe_checkout_session_id", session_id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, booking: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pending } = await admin
      .from("pending_bookings")
      .select("*")
      .eq("stripe_checkout_session_id", session_id)
      .maybeSingle();
    if (!pending) throw new Error("Pending booking not found");

    const env = resolveEnv(undefined);
    const stripe = createStripeClient(env);
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ ok: false, status: session.payment_status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pi: any = session.payment_intent;
    const piId = typeof pi === "string" ? pi : pi?.id || null;
    const chargeId = typeof pi === "object" ? pi?.latest_charge || null : null;

    // Determine status from owner's auto_confirm
    const { data: settings } = await admin
      .from("business_settings")
      .select("auto_confirm")
      .eq("user_id", pending.user_id)
      .maybeSingle();

    const status = settings?.auto_confirm ? "confirmed" : "pending";

    // Generate confirmation code via DB function
    const { data: codeRow } = await admin.rpc("generate_booking_code");

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .insert({
        user_id: pending.user_id,
        client_name: pending.client_name,
        client_email: pending.client_email,
        service: pending.service,
        booking_date: pending.booking_date,
        booking_time: pending.booking_time,
        duration_minutes: pending.duration_minutes,
        notes: pending.notes,
        status,
        confirmation_code: codeRow,
        stripe_checkout_session_id: session_id,
        stripe_payment_intent_id: piId,
        stripe_charge_id: chargeId,
        deposit_amount: pending.deposit_amount,
        platform_fee_amount: pending.platform_fee_amount,
        payment_status: "paid",
      })
      .select()
      .single();
    if (bErr) throw new Error(bErr.message);

    // Clean up pending row
    await admin.from("pending_bookings").delete().eq("id", pending.id);

    return new Response(JSON.stringify({ ok: true, booking }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-booking-payment error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
