// Owner refunds a booking's deposit (and reverses both platform fee + transfer).
// Also fires customer refund email (idempotent with the webhook via refund_id key).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";
import { notifyAdmin, money } from "../_shared/notify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}
function formatTime(t: string): string { return (t || "").slice(0, 5); }

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

    const env = resolveEnv((booking as any).payment_environment);
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

    // Fetch business name + currency for the email
    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, currency")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    const currency = (settings?.currency || "GBP").toUpperCase();
    const refundAmount = booking.deposit_amount
      ? `${currency} ${Number(booking.deposit_amount).toFixed(2)}`
      : undefined;

    if (booking.client_email) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-refunded",
            recipientEmail: booking.client_email,
            idempotencyKey: `refund-${booking.id}-${refund.id}`,
            templateData: {
              businessName: settings?.business_name || "the business",
              clientName: booking.client_name,
              service: booking.service,
              date: formatDate(booking.booking_date),
              time: formatTime(booking.booking_time),
              refundAmount,
            },
          },
        });
      } catch (e) { console.error("refund email failed", e); }

    await notifyAdmin(admin, {
      eventTitle: "Booking refunded",
      businessName: settings?.business_name || "",
      rows: [
        { label: "Client", value: booking.client_name },
        { label: "Service", value: booking.service },
        { label: "Refund amount", value: String(refundAmount) },
      ],
      idempotencyKey: `refund-${booking.id}-${refund.id}`,
    });
    }

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
