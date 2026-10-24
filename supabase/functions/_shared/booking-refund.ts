// Single place that refunds a booking through Stripe and records the outcome.
// On failure: payment_status='refund_failed', error stored, owner emailed,
// platform admin alerted. Never throws.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "./stripe.ts";
import { notifyAdmin } from "./notify-admin.ts";
import { chargedAmount, formatMoney } from "./refund-rules.ts";

export function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
export function fmtTime(t: string): string { return (t || "").slice(0, 5); }

export type RefundResult =
  | { ok: true; refundId: string; amount: number; partial: boolean }
  | { ok: false; error: string; amount: number };

export async function ownerEmail(admin: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data } = await admin.rpc("get_owner_email", { _user_id: userId });
    return (data as string | null) || null;
  } catch { return null; }
}

export const OPEN_STATUSES = ["pending", "confirmed", "in_progress"];

/** Stripe idempotency key: same booking + amount + attempt → same refund, so a
 *  double click can never refund twice; a genuine retry after a failure bumps
 *  the attempt count so it isn't blocked by the failed attempt's key. */
export function refundIdempotencyKey(bookingId: string, amountMajor: number, failedAttempts: number): string {
  const pence = Math.round(amountMajor * 100);
  return failedAttempts > 0 ? `refund-${bookingId}-${pence}-retry${failedAttempts}` : `refund-${bookingId}-${pence}`;
}

/**
 * Atomically claims a booking for refunding: moves payment_status to
 * 'refund_processing' only if it is still exactly what we read (paid /
 * refund_failed). Returns false when another request got there first.
 */
export async function lockForRefund(admin: SupabaseClient, booking: any, opts: { requireOpen?: boolean } = {}): Promise<boolean> {
  if (booking.payment_status !== "paid" && booking.payment_status !== "refund_failed") return false;
  let q = admin.from("bookings")
    .update({ payment_status: "refund_processing", updated_at: new Date().toISOString() })
    .eq("id", booking.id)
    .eq("payment_status", booking.payment_status);
  if (opts.requireOpen) q = q.in("status", OPEN_STATUSES);
  const { data, error } = await q.select("id");
  if (error) { console.error("lockForRefund", error); return false; }
  return (data?.length ?? 0) === 1;
}

/**
 * Refunds `amount` (major units; defaults to the full charged amount).
 * `context` is a short label for alerts, e.g. "owner cancel".
 */
export async function refundBooking(
  admin: SupabaseClient,
  booking: any,
  opts: { amount?: number; context: string; businessName?: string; currency?: string },
): Promise<RefundResult> {
  const charged = chargedAmount(booking);
  const amount = Math.min(opts.amount ?? charged, charged);
  const partial = amount < charged;
  const currency = (opts.currency || "GBP").toUpperCase();

  try {
    if (!booking.stripe_payment_intent_id) throw new Error("No Stripe payment is linked to this booking");
    const stripe = createStripeClient(resolveEnv(booking.payment_environment));
    // Fee/transfer handling deliberately unchanged (see Part 2).
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      ...(partial ? { amount: Math.round(amount * 100) } : {}),
      refund_application_fee: true,
      reverse_transfer: true,
    }, { idempotencyKey: refundIdempotencyKey(booking.id, amount, Number(booking.refund_attempts ?? 0)) });
    await admin.from("bookings").update({
      payment_status: partial ? "partially_refunded" : "refunded",
      refund_id: refund.id,
      refund_amount: amount,
      refund_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", booking.id);
    return { ok: true, refundId: refund.id, amount, partial };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`refund failed (${opts.context})`, booking.id, error);
    // Never overwrite a booking that a parallel path / the webhook already marked refunded.
    const { data: marked } = await admin.from("bookings").update({
      payment_status: "refund_failed",
      refund_amount: amount,
      refund_error: error.slice(0, 500),
      refund_attempts: Number(booking.refund_attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", booking.id).not("payment_status", "in", "(refunded,partially_refunded)").select("id");
    if (!marked?.length) {
      const { data: cur } = await admin.from("bookings").select("refund_id, refund_amount").eq("id", booking.id).maybeSingle();
      return { ok: true, refundId: cur?.refund_id || "", amount: Number(cur?.refund_amount ?? amount), partial };
    }

    const when = `${fmtDate(booking.booking_date)} ${fmtTime(booking.booking_time)}`;
    const to = await ownerEmail(admin, booking.user_id);
    if (to) {
      try {
        await admin.functions.invoke("app-email", {
          body: {
            templateName: "refund-failed-owner",
            recipientEmail: to,
            idempotencyKey: `refund-failed-${booking.id}-${Date.now()}`,
            templateData: {
              businessName: opts.businessName || "",
              clientName: booking.client_name,
              service: booking.service,
              when,
              amount: formatMoney(amount, currency),
              error,
            },
          },
        });
      } catch (err) { console.error("refund-failed owner email failed", err); }
    }
    await notifyAdmin(admin, {
      eventTitle: "Refund failed",
      eventSummary: error,
      businessName: opts.businessName || "",
      rows: [
        { label: "Client", value: booking.client_name },
        { label: "Booking", value: `${booking.service} · ${when}` },
        { label: "Amount", value: formatMoney(amount, currency) },
        { label: "Path", value: opts.context },
        { label: "Booking id", value: booking.id },
      ],
      idempotencyKey: `refund-failed-${booking.id}-${Date.now()}`,
    });
    return { ok: false, error, amount };
  }
}

/** Client-facing sentence about money for the cancellation email. */
export function refundNote(r: { refunded: number; kept: number; failed: boolean; currency: string; paid: boolean }): string {
  if (!r.paid) return "";
  const parts: string[] = [];
  if (r.failed) {
    parts.push(`Your refund of ${formatMoney(r.refunded, r.currency)} couldn't be processed automatically. The business has been told and will refund you directly.`);
  } else if (r.refunded > 0) {
    parts.push(`${formatMoney(r.refunded, r.currency)} has been refunded to your original payment method. It can take 5–10 working days to appear.`);
  }
  if (r.kept > 0) parts.push(`Your ${formatMoney(r.kept, r.currency)} deposit is non-refundable because the booking was cancelled inside the cancellation window.`);
  return parts.join(" ");
}
