// PUBLIC endpoint — lets a client cancel their own booking via the self-service token.
// Checks the business cancellation window, refunds the deposit if within policy.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
function formatTime(t: string): string { return (t || "").slice(0, 5); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("*")
      .eq("client_access_token", token)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token expiry check
    if (booking.client_token_expires_at && new Date(booking.client_token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link expired" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already cancelled or completed
    if (["cancelled_by_client", "cancelled", "completed", "no_show"].includes(booking.status)) {
      return new Response(JSON.stringify({ error: `Booking is already ${booking.status}` }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cancellation window
    const { data: settings } = await admin
      .from("business_settings")
      .select("cancellation_hours, business_name, currency")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    const cancellationHours = settings?.cancellation_hours ?? 24;
    const appointmentTime = new Date(`${booking.booking_date}T${booking.booking_time}`).getTime();
    const now = Date.now();
    const hoursUntil = (appointmentTime - now) / (3600 * 1000);

    if (hoursUntil < cancellationHours) {
      return new Response(JSON.stringify({
        error: `Cancellations must be made at least ${cancellationHours} hours before the appointment`,
        code: "past_cancellation_window",
      }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refund deposit if paid
    let refundId: string | null = null;
    if (booking.payment_status === "paid" && booking.stripe_payment_intent_id) {
      try {
        const env = resolveEnv((booking as any).payment_environment);
        const stripe = createStripeClient(env);
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          refund_application_fee: true,
          reverse_transfer: true,
        });
        refundId = refund.id;
      } catch (e) {
        console.error("refund failed", e);
        // Continue to cancel even if refund fails — owner can handle manually
      }
    }

    const updates: any = {
      status: "cancelled_by_client",
      updated_at: new Date().toISOString(),
    };
    if (refundId) {
      updates.payment_status = "refunded";
      updates.refund_id = refundId;
    }

    await admin.from("bookings").update(updates).eq("id", booking.id);

    // Send cancellation confirmation email
    if (booking.client_email) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-cancelled-client",
            recipientEmail: booking.client_email,
            idempotencyKey: `client-cancel-${booking.id}`,
            templateData: {
              businessName: settings?.business_name || "the business",
              clientName: booking.client_name,
              service: booking.service,
              date: formatDate(booking.booking_date),
              time: formatTime(booking.booking_time),
            },
          },
        });
      } catch (e) { console.error("cancel email failed", e); }
    }

    return new Response(JSON.stringify({ ok: true, refunded: !!refundId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cancel-booking-client error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
