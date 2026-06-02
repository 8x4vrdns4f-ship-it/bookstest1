// Owner refunds a booking's deposit (and reverses both platform fee + transfer).
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

    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("Missing booking_id");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking } = await admin
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!booking) throw new Error("Booking not found");
    if (booking.payment_status !== "paid") throw new Error("Booking has no captured payment");
    if (!booking.stripe_payment_intent_id) throw new Error("No payment intent on booking");

    const env = resolveEnv(undefined);
    const stripe = createStripeClient(env);
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      refund_application_fee: true,
      reverse_transfer: true,
    });

    await admin
      .from("bookings")
      .update({ payment_status: "refunded", refund_id: refund.id, updated_at: new Date().toISOString() })
      .eq("id", booking_id);

    return new Response(JSON.stringify({ ok: true, refund_id: refund.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refund-booking-deposit error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
