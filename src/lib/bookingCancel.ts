import { supabase } from "@/integrations/supabase/client";

export type PaymentFields = {
  payment_status?: string | null;
  payment_option?: string | null;
  charge_amount?: number | string | null;
  deposit_amount?: number | string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_charge_id?: string | null;
  refund_id?: string | null;
};

/** Amount actually charged: charge_amount, falling back to deposit_amount. */
export function chargedAmount(b: PaymentFields): number {
  const c = b.charge_amount != null ? Number(b.charge_amount) : NaN;
  if (Number.isFinite(c) && c > 0) return Math.round(c * 100) / 100;
  const d = Number(b.deposit_amount ?? 0);
  return Number.isFinite(d) && d > 0 ? Math.round(d * 100) / 100 : 0;
}

export function isPaid(b: PaymentFields): boolean {
  return (b.payment_status === "paid" || b.payment_status === "refund_failed") && chargedAmount(b) > 0;
}

/** Any payment record at all → the booking can never be deleted. */
export function hasPaymentRecord(b: PaymentFields): boolean {
  const ps = b.payment_status || "unpaid";
  return !["unpaid", "none", ""].includes(ps)
    || !!b.stripe_payment_intent_id || !!b.stripe_checkout_session_id || !!b.stripe_charge_id || !!b.refund_id;
}

export function money(amount: number, currency = "GBP"): string {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount); }
  catch { return `£${amount.toFixed(2)}`; }
}

export type CancelResult = { ok: boolean; refunded?: number; refund_failed?: boolean; error?: string; cancelledByUser?: boolean };

/**
 * The only way the dashboard cancels/declines a booking. Confirms first,
 * showing the real refund amount for paid bookings.
 */
export async function cancelBookingAsOwner(
  b: PaymentFields & { id: string; client_name?: string },
  opts: { mode?: "cancel" | "decline"; reason?: string; currency?: string; skipConfirm?: boolean } = {},
): Promise<CancelResult> {
  if (!opts.skipConfirm) {
    const msg = isPaid(b)
      ? `Cancel this booking? ${money(chargedAmount(b), opts.currency)} will be refunded to the client.`
      : opts.mode === "decline" ? "Decline this booking request?" : "Cancel this booking?";
    if (!window.confirm(msg)) return { ok: false, cancelledByUser: true };
  }
  const { data, error } = await supabase.functions.invoke("cancel-booking-owner", {
    body: { booking_id: b.id, mode: opts.mode || "cancel", reason: opts.reason },
  });
  if (error || !data?.ok) {
    let message = data?.error || error?.message || "Could not cancel booking";
    try { const ctx = await (error as any)?.context?.json?.(); if (ctx?.error) message = ctx.error; } catch { /* ignore */ }
    return { ok: false, error: message };
  }
  return { ok: true, refunded: data.refunded, refund_failed: data.refund_failed };
}

export function cancelToastText(r: CancelResult, currency = "GBP"): { title: string; description?: string; destructive?: boolean } {
  if (!r.ok) return { title: "Couldn't cancel", description: r.error, destructive: true };
  if (r.refund_failed) return { title: "Cancelled — refund failed", description: "The refund didn't go through. Use \"Retry refund\" on the booking.", destructive: true };
  if (r.refunded) return { title: "Booking cancelled", description: `${money(r.refunded, currency)} refunded to the client.` };
  return { title: "Booking cancelled" };
}
