// Pure money rules for booking payments (no Deno/network imports — unit-tested
// from src/test/ledgerRules.test.ts). All amounts are integer minor units (pence).
//
// Principle: BookSuite never loses money on booking payments. Stripe processing
// fees, refunds, chargebacks and dispute fees are carried by the business.

/** Minimum Stripe fee for a standard UK card: 1.5% + 20p. */
export function standardStripeFeeMinor(chargeMinor: number): number {
  if (chargeMinor <= 0) return 0;
  return Math.round(chargeMinor * 0.015) + 20;
}

export type ApplicationFeePlan = {
  applicationFeeMinor: number;
  platformFeeMinor: number;
  stripeFeeIncludedMinor: number;
  collectedMinor: number;
};

/**
 * application_fee_amount = BookSuite fee + standard Stripe fee + collection of
 * any outstanding tab, with collection capped so the business still receives
 * at least 50% of the charge. Never exceeds the charge itself.
 */
export function planApplicationFee(opts: {
  chargeMinor: number;
  platformFeeMinor: number;
  outstandingMinor: number;
}): ApplicationFeePlan {
  const charge = Math.max(0, Math.floor(opts.chargeMinor));
  const platform = Math.max(0, Math.round(opts.platformFeeMinor));
  const stripeFee = standardStripeFeeMinor(charge);
  const base = Math.min(charge, platform + stripeFee);
  const maxFee = Math.floor(charge * 0.5);
  const room = Math.max(0, maxFee - base);
  const collected = Math.max(0, Math.min(Math.max(0, Math.round(opts.outstandingMinor)), room));
  return {
    applicationFeeMinor: base + collected,
    platformFeeMinor: platform,
    stripeFeeIncludedMinor: Math.min(stripeFee, base - Math.min(platform, base)),
    collectedMinor: collected,
  };
}

/** What the business still owes because Stripe charged more than we included. */
export function stripeFeeShortfallMinor(actualFeeMinor: number, includedFeeMinor: number): number {
  return Math.max(0, Math.round(actualFeeMinor) - Math.round(includedFeeMinor));
}

/** BookSuite's loss on a refund = refunded − what was pulled back from the business. */
export function refundShortfallMinor(refundMinor: number, reversedMinor: number): number {
  return Math.max(0, Math.round(refundMinor) - Math.round(reversedMinor));
}

/** Booking payment status after Stripe says how much of a charge is refunded. */
export function refundedStatus(amountRefundedMinor: number, amountChargedMinor: number): "refunded" | "partially_refunded" {
  return amountRefundedMinor >= amountChargedMinor ? "refunded" : "partially_refunded";
}

export type LedgerRow = { amount_minor: number; created_at?: string; type?: string };

export function ledgerBalanceMinor(rows: LedgerRow[]): number {
  return rows.reduce((s, r) => s + Math.round(Number(r.amount_minor) || 0), 0);
}

/**
 * Amount to put on the business's next subscription invoice: debts older than
 * `days`, less every credit/collection so far and anything already invoiced
 * but not yet paid. Never negative.
 */
export function amountToInvoiceMinor(rows: LedgerRow[], pendingInvoicedMinor: number, nowMs: number, days = 14): number {
  const cutoff = nowMs - days * 86_400_000;
  let agedDebt = 0;
  let credits = 0;
  for (const r of rows) {
    const a = Math.round(Number(r.amount_minor) || 0);
    if (a < 0) credits += a;
    else if (r.created_at && Date.parse(r.created_at) <= cutoff) agedDebt += a;
  }
  const total = ledgerBalanceMinor(rows);
  return Math.max(0, Math.min(agedDebt + credits, total) - Math.max(0, pendingInvoicedMinor));
}

/** Stripe dispute fee from the dispute's balance transactions (positive = charged). */
export function disputeFeeMinor(balanceTransactions: Array<{ fee?: number }>): number {
  return balanceTransactions.reduce((s, bt) => s + Math.max(0, Number(bt.fee) || 0), 0);
}

/** Fee Stripe gave back when a dispute was won (positive number = credit). */
export function disputeFeeReturnedMinor(balanceTransactions: Array<{ fee?: number }>): number {
  return balanceTransactions.reduce((s, bt) => s + Math.max(0, -(Number(bt.fee) || 0)), 0);
}
