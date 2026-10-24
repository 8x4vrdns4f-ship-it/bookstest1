// PUBLIC endpoint (session-token protected) — cancel or reschedule one of the
// customer's own bookings. Every rule is re-validated server side.
import {
  adminClient, corsHeaders, formatDate, formatTime, json, resolveSession,
} from "../_shared/portalSession.ts";
import { availableSlots, bookableDateRange, loadAvailability } from "../_shared/portalSlots.ts";
import { loadCancelSettings, performClientCancel, quoteFor } from "../_shared/client-cancel.ts";
import { cancelPolicyLine, zonedTimeToUtcMs } from "../_shared/refund-rules.ts";

const CLOSED_STATUSES = ["cancelled_by_client", "cancelled", "completed", "no_show", "declined"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { session_token, booking_id, action, date, time } = body;
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

    if (action === "cancel") {
      if (body.preview) {
        const q = quoteFor(booking, await loadCancelSettings(admin, booking.user_id));
        return json({ ok: true, preview: true, late: q.late, cancellation_hours: q.cancellationHours, charged: q.charged, refund: q.refund, kept: q.kept, currency: q.currency });
      }
      const r = await performClientCancel(admin, booking, "customer portal");
      if ("conflict" in r) return json({ error: "Already being processed", code: "already_processing" }, 409);
      return json({ ...r, status: "cancelled_by_client" });
    }

    const { data: settings } = await admin
      .from("business_settings")
      .select("cancellation_hours, business_name, business_email, currency, timezone")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    // Reschedules still have to happen outside the cancellation window.
    const cancellationHours = settings?.cancellation_hours ?? 24;
    const appointment = zonedTimeToUtcMs(booking.booking_date, booking.booking_time, settings?.timezone || "Europe/London");
    const hoursUntil = (appointment - Date.now()) / 3_600_000;
    if (hoursUntil < cancellationHours) {
      return json({
        error: `Changes must be made at least ${cancellationHours} hours before the appointment. Please contact ${settings?.business_name || "the business"} directly.`,
        code: "past_cancellation_window",
      }, 403);
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
      await admin.functions.invoke("app-email", {
        body: {
          templateName: "booking-confirmed",
          businessUserId: booking.user_id,
          recipientEmail: booking.client_email,
          idempotencyKey: `portal-reschedule-${booking.id}-${date}-${time}`,
          templateData: {
            businessName: settings?.business_name || "the business",
            clientName: booking.client_name,
            service: booking.service,
            date: formatDate(date),
            time,
            confirmationCode: booking.confirmation_code,
            manageUrl: booking.client_access_token ? `https://booksuite.online/booking/manage/${booking.client_access_token}` : undefined,
            policyText: cancelPolicyLine(settings?.cancellation_hours, booking.deposit_amount, String(settings?.currency || "GBP").toUpperCase(), booking.payment_option === "full"),
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
