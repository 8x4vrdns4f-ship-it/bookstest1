// Single place that refunds a booking through Stripe and records the outcome.
// On failure: payment_status='refund_failed', error stored, owner emailed,
// platform admin alerted. Never throws.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "./stripe.ts";
import { notifyAdmin } from "./notify-admin.ts";
import { addLedgerEntry } from "./ledger.ts";
import { refundShortfallMinor } from "./ledger-rules.ts";
import { chargedAmount, formatMoney, refundIdempotencyKey } from "./refund-rules.ts";

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
    const env = resolveEnv(booking.payment_environment);
    const stripe = createStripeClient(env);
    const key = refundIdempotencyKey(booking.id, amount, Number(booking.refund_attempts ?? 0));
    const amountMinor = Math.round(amount * 100);
    const meta = { booksuite_booking_id: booking.id, booksuite_context: opts.context };
    // BookSuite keeps its application fee; the business returns what it was paid.
    let refund: any;
    let reverseFailed: string | null = null;
    try {
      refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        ...(partial ? { amount: amountMinor } : {}),
        refund_application_fee: false,
        reverse_transfer: true,
        metadata: meta,
      }, { idempotencyKey: key });
    } catch (e: any) {
      const msg = String(e?.raw?.message || e?.message || "");
      // The business's Stripe balance can't cover the reversal: refund the client
      // anyway and put the whole amount on the business's tab.
      if (!/insufficient/i.test(msg)) throw e;
      reverseFailed = msg;
      refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        ...(partial ? { amount: amountMinor } : {}),
        refund_application_fee: false,
        reverse_transfer: false,
        metadata: { ...meta, booksuite_reversal_failed: "1" },
      }, { idempotencyKey: `${key}-norev` });
    }
    await recordRefundLedger(admin, stripe, booking, refund, env, reverseFailed);
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

/**
 * Ledger after a refund, from Stripe's real objects: shortfall = refund amount
 * − transfer reversal amount. No reversal at all → whole refund is unreversed.
 */
export async function recordRefundLedger(admin: SupabaseClient, stripe: any, booking: any, refund: any, env: string, reverseFailed: string | null = null) {
  const currency = String(refund.currency || "gbp").toUpperCase();
  let reversedMinor = 0;
  try {
    const revId = typeof refund.transfer_reversal === "string" ? refund.transfer_reversal : refund.transfer_reversal?.id;
    if (revId) {
      const r = typeof refund.transfer_reversal === "object" && refund.transfer_reversal?.amount != null
        ? refund.transfer_reversal
        : await stripe.refunds.retrieve(refund.id, { expand: ["transfer_reversal"] }).then((x: any) => x.transfer_reversal);
      reversedMinor = Number(r?.amount ?? 0);
    }
  } catch (e) { console.error("transfer reversal lookup failed", e); }
  if (reversedMinor === 0) {
    await addLedgerEntry(admin, {
      userId: booking.user_id, bookingId: booking.id, type: "unreversed_refund", amountMinor: Number(refund.amount),
      currency, environment: env, stripeObjectId: `unrev-${refund.id}`,
      note: reverseFailed ? `Refund not recovered from business balance: ${reverseFailed.slice(0, 200)}` : "Refund not recovered from business balance",
    });
    return;
  }
  const short = refundShortfallMinor(Number(refund.amount), reversedMinor);
  await addLedgerEntry(admin, {
    userId: booking.user_id, bookingId: booking.id, type: "refund_shortfall", amountMinor: short,
    currency, environment: env, stripeObjectId: refund.id, note: "Refund larger than amount recovered from business",
  });
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
  else if (!r.failed && r.refunded > 0) parts.push("Nothing has been kept.");
  return parts.join(" ");
}
