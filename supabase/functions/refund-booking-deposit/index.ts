// Owner refunds a booking's payment (also used for "Retry refund" after a failure).
// Fee/transfer handling unchanged. Customer refund email is idempotent with the
// webhook via the refund id key.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { fmtDate, fmtTime, refundBooking } from "../_shared/booking-refund.ts";
import { notifyAdmin } from "../_shared/notify-admin.ts";
import { chargedAmount, formatMoney } from "../_shared/refund-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { booking_id } = await req.json();
    if (!booking_id || typeof booking_id !== "string") return json({ error: "Missing booking_id" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: booking } = await admin.from("bookings").select("*")
      .eq("id", booking_id).eq("user_id", userData.user.id).maybeSingle();
    if (!booking) return json({ error: "Booking not found" }, 404);
    const retry = booking.payment_status === "refund_failed";
    if (booking.payment_status !== "paid" && !retry) return json({ error: "Booking has no captured payment" }, 400);

    const { data: settings } = await admin.from("business_settings")
      .select("business_name, currency").eq("user_id", booking.user_id).maybeSingle();
    const currency = (settings?.currency || "GBP").toUpperCase();
    const businessName = settings?.business_name || "the business";

    // A retry refunds the amount that was due last time (late cancels keep the deposit).
    const amount = retry && booking.refund_amount ? Number(booking.refund_amount) : chargedAmount(booking);
    const r = await refundBooking(admin, booking, { amount, context: retry ? "owner retry" : "owner refund button", businessName, currency });
    if (!r.ok) return json({ ok: false, refund_failed: true, error: r.error }, 502);

    const refundAmount = formatMoney(r.amount, currency);
    if (booking.client_email) {
      try {
        await admin.functions.invoke("app-email", {
          body: {
            templateName: "booking-refunded",
            businessUserId: booking.user_id,
            recipientEmail: booking.client_email,
            idempotencyKey: `refund-${booking.id}-${r.refundId}`,
            templateData: {
              businessName, clientName: booking.client_name, service: booking.service,
              date: fmtDate(booking.booking_date), time: fmtTime(booking.booking_time), refundAmount,
            },
          },
        });
      } catch (e) { console.error("refund email failed", e); }
    }

    await notifyAdmin(admin, {
      eventTitle: retry ? "Booking refunded (retry)" : "Booking refunded",
      businessName: settings?.business_name || "",
      rows: [
        { label: "Client", value: booking.client_name },
        { label: "Service", value: booking.service },
        { label: "Refund amount", value: refundAmount },
      ],
      idempotencyKey: `refund-${booking.id}-${r.refundId}`,
    });

    return json({ ok: true, refund_id: r.refundId, amount: r.amount });
  } catch (e) {
    console.error("refund-booking-deposit error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
