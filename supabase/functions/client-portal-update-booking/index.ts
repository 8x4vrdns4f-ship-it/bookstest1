// PUBLIC endpoint (session-token protected) — cancel or reschedule one of the
// customer's own bookings. Every rule is re-validated server side.
import {
  adminClient, corsHeaders, formatDate, formatTime, json, resolveSession,
} from "../_shared/portalSession.ts";
import { availableSlots, bookableDateRange, loadAvailability } from "../_shared/portalSlots.ts";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const CLOSED_STATUSES = ["cancelled_by_client", "cancelled", "completed", "no_show", "declined"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_token, booking_id, action, date, time } = await req.json().catch(() => ({}));
    const admin = adminClient();
    const email = await resolveSession(admin, session_token);
    if (!email) return json({ error: "Session expired", code: "no_session" }, 401);
    if (typeof booking_id !== "string") return json({ error: "Missing booking" }, 400);
    if (action !== "cancel" && action !== "reschedule") return json({ error: "Unknown action" }, 400);

    const { data: booking } = await admin
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .maybeSingle();
    if (!booking || (booking.client_email || "").toLowerCase() !== email) {
      return json({ error: "Booking not found" }, 404);
    }
    if (CLOSED_STATUSES.includes(booking.status)) {
      return json({ error: `This booking is already ${booking.status.replace(/_/g, " ")}` }, 409);
    }

    const { data: settings } = await admin
      .from("business_settings")
      .select("cancellation_hours, business_name, business_email, currency")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    const cancellationHours = settings?.cancellation_hours ?? 24;
    const appointment = new Date(`${booking.booking_date}T${booking.booking_time}`).getTime();
    const hoursUntil = (appointment - Date.now()) / 3_600_000;
    if (hoursUntil < cancellationHours) {
      return json({
        error: `Changes must be made at least ${cancellationHours} hours before the appointment. Please contact ${settings?.business_name || "the business"} directly.`,
        code: "past_cancellation_window",
      }, 403);
    }

    if (action === "cancel") {
      let refundId: string | null = null;
      if (booking.payment_status === "paid" && booking.stripe_payment_intent_id) {
        try {
          const stripe = createStripeClient(resolveEnv(booking.payment_environment));
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
            refund_application_fee: true,
            reverse_transfer: true,
          });
          refundId = refund.id;
        } catch (e) {
          console.error("portal refund failed", e);
        }
      }

      const updates: Record<string, unknown> = {
        status: "cancelled_by_client",
        updated_at: new Date().toISOString(),
      };
      if (refundId) { updates.payment_status = "refunded"; updates.refund_id = refundId; }
      await admin.from("bookings").update(updates).eq("id", booking.id);

      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-cancelled-client",
            recipientEmail: booking.client_email,
            idempotencyKey: `portal-cancel-${booking.id}`,
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

      try {
        await admin.functions.invoke("notify-waitlist", {
          body: { user_id: booking.user_id, date: booking.booking_date },
        });
      } catch (e) { console.error("waitlist notify failed", e); }

      return json({ ok: true, refunded: !!refundId, status: "cancelled_by_client" });
    }

    // ---- reschedule ----
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: "Pick a valid day" }, 400);
    }
    if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
      return json({ error: "Pick a valid time" }, 400);
    }

    const { data: ws } = await admin.rpc("get_widget_settings", { p_user_id: booking.user_id });
    const widgetSettings = (ws as any[])?.[0] ?? {};
    const range = bookableDateRange(widgetSettings);
    if (date < range.from || date > range.to) {
      return json({ error: "That day is outside the booking window" }, 400);
    }

    const ctx = await loadAvailability(admin, booking.user_id, range.from, range.to);
    const free = availableSlots(ctx, date, booking.duration_minutes || 30, {
      date: booking.booking_date,
      time: booking.booking_time,
    });
    if (!free.includes(time)) {
      return json({ error: "That time has just been taken. Please pick another." }, 409);
    }

    const { error: upErr } = await admin
      .from("bookings")
      .update({
        booking_date: date,
        booking_time: `${time}:00`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);
    if (upErr) throw upErr;

    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "booking-confirmed",
          recipientEmail: booking.client_email,
          idempotencyKey: `portal-reschedule-${booking.id}-${date}-${time}`,
          templateData: {
            businessName: settings?.business_name || "the business",
            clientName: booking.client_name,
            service: booking.service,
            date: formatDate(date),
            time,
            confirmationCode: booking.confirmation_code,
          },
        },
      });
    } catch (e) { console.error("reschedule email failed", e); }

    return json({ ok: true, booking_date: date, booking_time: `${time}:00` });
  } catch (e) {
    console.error("client-portal-update-booking error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
