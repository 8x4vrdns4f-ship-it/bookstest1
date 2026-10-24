// Shared client self-cancel (manage-booking link and customer portal).
// Outside the window: full refund. Inside: deposit kept, any extra refunded.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { quoteClientCancel, formatMoney, type ClientCancelQuote } from "./refund-rules.ts";
import { fmtDate, fmtTime, ownerEmail, refundBooking, refundNote } from "./booking-refund.ts";

export const CLIENT_CLOSED = ["cancelled_by_client", "cancelled", "completed", "no_show", "declined"];

export async function loadCancelSettings(admin: SupabaseClient, userId: string) {
  const { data } = await admin
    .from("business_settings")
    .select("cancellation_hours, business_name, currency, timezone")
    .eq("user_id", userId)
    .maybeSingle();
  return data as { cancellation_hours: number | null; business_name: string | null; currency: string | null; timezone: string | null } | null;
}

export function quoteFor(booking: any, settings: any): ClientCancelQuote & { currency: string } {
  const q = quoteClientCancel(booking, {
    cancellationHours: settings?.cancellation_hours ?? 24,
    timeZone: settings?.timezone || "Europe/London",
  });
  return { ...q, currency: (settings?.currency || "GBP").toUpperCase() };
}

export async function performClientCancel(admin: SupabaseClient, booking: any, source: string) {
  const settings = await loadCancelSettings(admin, booking.user_id);
  const q = quoteFor(booking, settings);
  const businessName = settings?.business_name || "the business";

  let refunded = 0;
  let failed = false;
  if (q.refund > 0) {
    const r = await refundBooking(admin, booking, {
      amount: q.refund, context: `client cancel (${source})`, businessName, currency: q.currency,
    });
    if (r.ok) refunded = r.amount; else { failed = true; refunded = r.amount; }
  }

  await admin.from("bookings").update({
    status: "cancelled_by_client",
    updated_at: new Date().toISOString(),
  }).eq("id", booking.id);

  const paid = q.charged > 0;
  const note = refundNote({ refunded, kept: q.kept, failed, currency: q.currency, paid });
  const base = {
    businessName,
    clientName: booking.client_name,
    service: booking.service,
    date: fmtDate(booking.booking_date),
    time: fmtTime(booking.booking_time),
  };

  if (booking.client_email) {
    try {
      await admin.functions.invoke("app-email", {
        body: {
          templateName: "booking-cancelled-client",
          businessUserId: booking.user_id,
          recipientEmail: booking.client_email,
          idempotencyKey: `client-cancel-${booking.id}`,
          templateData: { ...base, refundNote: note },
        },
      });
    } catch (e) { console.error("cancel email failed", e); }
  }

  try {
    await admin.functions.invoke("notify-waitlist", { body: { user_id: booking.user_id, date: booking.booking_date } });
  } catch (e) { console.error("waitlist notify failed", e); }

  const to = await ownerEmail(admin, booking.user_id);
  if (to) {
    const ownerNote = !paid ? "" :
      [q.kept > 0 ? `You keep the ${formatMoney(q.kept, q.currency)} deposit.` : "",
       refunded > 0 ? `${formatMoney(refunded, q.currency)} ${failed ? "could NOT be refunded automatically — please refund manually or retry from your dashboard." : "was refunded to the client."}` : ""]
        .filter(Boolean).join(" ");
    try {
      await admin.functions.invoke("app-email", {
        body: {
          templateName: "booking-cancelled-owner",
          recipientEmail: to,
          idempotencyKey: `owner-client-cancel-${booking.id}`,
          templateData: { ...base, late: q.late, moneyNote: ownerNote },
        },
      });
    } catch (e) { console.error("owner cancel email failed", e); }
  }

  return { ok: true, late: q.late, refunded: failed ? 0 : refunded, refund_failed: failed, kept: q.kept, currency: q.currency };
}
