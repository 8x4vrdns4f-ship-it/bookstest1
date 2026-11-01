// Pure booking-fee rules (no Deno/network imports — unit-tested from
// src/test/bookingFeeRules.test.ts). All amounts are integer minor units (pence).
//
// Must stay in sync with the database functions tier_booking_fee_minor(),
// tier_booking_fee_cap_minor(), booking_fee_tier(), booking_fee_month() and
// reserve_booking_fee(), and with feeMinor / feeCapMinor in src/lib/tierLimits.ts.

export type FeeTier = "silver" | "gold" | "platinum";

export const BOOKING_FEE_TERMS: Record<FeeTier, { feeMinor: number; capMinor: number }> = {
  silver: { feeMinor: 30, capMinor: 2500 },
  gold: { feeMinor: 30, capMinor: 2500 },
  platinum: { feeMinor: 0, capMinor: 0 },
};

/** Fee terms for a subscription. Trials and businesses with no plan use Silver's terms. */
export function bookingFeeTerms(tier: string | null | undefined, status?: string | null) {
  const t = tier ? String(tier).toLowerCase() : null;
  if (!t || status === "trialing" || !(t in BOOKING_FEE_TERMS)) return BOOKING_FEE_TERMS.silver;
  return BOOKING_FEE_TERMS[t as FeeTier];
}

/** "YYYY-MM" of the calendar month in UK time (Europe/London). */
export function londonMonthKey(at: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit" })
    .formatToParts(at);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}`;
}

/**
 * The booking fee for one charge: the plan's fee, or whatever is left of the
 * monthly cap, never more than the charge itself. A booking already charged
 * (e.g. a later balance payment) pays nothing.
 */
export function bookingFeeForCharge(opts: {
  feeMinor: number;
  capMinor: number;
  usedThisMonthMinor: number;
  chargeMinor: number;
  alreadyChargedForBooking?: boolean;
}): number {
  if (opts.alreadyChargedForBooking) return 0;
  return Math.max(0, Math.min(opts.feeMinor, opts.capMinor - opts.usedThisMonthMinor, Math.max(0, Math.floor(opts.chargeMinor))));
}

/**
 * In-memory model of the database counter (same rules as reserve_booking_fee),
 * used by tests: one used-total per business per UK month, one fee per booking.
 */
export class BookingFeeCounter {
  private used = new Map<string, number>();
  private charged = new Set<string>();
  constructor(private terms = BOOKING_FEE_TERMS.silver) {}
  charge(bookingRef: string, chargeMinor: number, at: Date): number {
    const month = londonMonthKey(at);
    const fee = bookingFeeForCharge({
      ...this.terms,
      usedThisMonthMinor: this.used.get(month) ?? 0,
      chargeMinor,
      alreadyChargedForBooking: this.charged.has(bookingRef),
    });
    this.used.set(month, (this.used.get(month) ?? 0) + fee);
    this.charged.add(bookingRef);
    return fee;
  }
  /** Refunds never give fee back to the cap. */
  refund(_bookingRef: string): void { /* BookSuite keeps the booking fee */ }
  usedIn(month: string): number { return this.used.get(month) ?? 0; }
}
