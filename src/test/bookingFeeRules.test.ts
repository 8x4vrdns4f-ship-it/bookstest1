import { describe, it, expect } from "vitest";
import {
  BookingFeeCounter, BOOKING_FEE_TERMS, bookingFeeForCharge, bookingFeeTerms, londonMonthKey,
} from "../../supabase/functions/_shared/booking-fee-rules";
import { planApplicationFee } from "../../supabase/functions/_shared/ledger-rules";
import { TIER_LIMITS } from "@/lib/tierLimits";

const nov = new Date("2026-11-10T12:00:00Z");

function chargeN(counter: BookingFeeCounter, n: number, at = nov) {
  const fees: number[] = [];
  for (let i = 1; i <= n; i++) fees.push(counter.charge(`b${i}`, 2000, at));
  return fees;
}

describe("booking fee: 30p per paid booking, capped at £25 a month", () => {
  it("83 bookings = £24.90", () => {
    const c = new BookingFeeCounter();
    chargeN(c, 83);
    expect(c.usedIn("2026-11")).toBe(2490);
  });
  it("the 84th booking pays only the 10p left", () => {
    const c = new BookingFeeCounter();
    const fees = chargeN(c, 84);
    expect(fees[83]).toBe(10);
    expect(c.usedIn("2026-11")).toBe(2500);
  });
  it("bookings 85 to 100 pay 0p and the total stays £25", () => {
    const c = new BookingFeeCounter();
    const fees = chargeN(c, 100);
    expect(fees.slice(84)).toEqual(new Array(16).fill(0));
    expect(c.usedIn("2026-11")).toBe(2500);
  });
  it("Silver and Gold both 30p / £25; Platinum 0", () => {
    expect(BOOKING_FEE_TERMS.silver).toEqual({ feeMinor: 30, capMinor: 2500 });
    expect(BOOKING_FEE_TERMS.gold).toEqual({ feeMinor: 30, capMinor: 2500 });
    expect(BOOKING_FEE_TERMS.platinum).toEqual({ feeMinor: 0, capMinor: 0 });
    expect([TIER_LIMITS.silver.bookingFeeMinor, TIER_LIMITS.gold.bookingFeeMinor, TIER_LIMITS.platinum.bookingFeeMinor]).toEqual([30, 30, 0]);
    expect([TIER_LIMITS.silver.bookingFeeCapMinor, TIER_LIMITS.gold.bookingFeeCapMinor, TIER_LIMITS.platinum.bookingFeeCapMinor]).toEqual([2500, 2500, 0]);
  });
  it("Platinum charges 0 booking fee; application fee is only the Stripe card fee", () => {
    const c = new BookingFeeCounter(bookingFeeTerms("platinum", "active"));
    expect(chargeN(c, 5)).toEqual([0, 0, 0, 0, 0]);
    const plan = planApplicationFee({ chargeMinor: 2000, platformFeeMinor: 0, outstandingMinor: 0 });
    expect(plan.applicationFeeMinor).toBe(50); // 1.5% of £20 + 20p
  });
  it("a free trial uses Silver's fee and cap, even on Platinum", () => {
    expect(bookingFeeTerms("platinum", "trialing")).toEqual({ feeMinor: 30, capMinor: 2500 });
    expect(bookingFeeTerms(null, null)).toEqual({ feeMinor: 30, capMinor: 2500 });
  });
});

describe("monthly reset on the 1st, UK time", () => {
  it("23:30 on 31 Oct UK (BST) is still October; 00:30 on 1 Nov UK is November", () => {
    expect(londonMonthKey(new Date("2026-10-31T22:30:00Z"))).toBe("2026-10"); // 23:30 BST
    expect(londonMonthKey(new Date("2026-11-01T00:30:00Z"))).toBe("2026-11"); // 00:30 GMT
  });
  it("00:30 on 1 Jun UK (BST) is June even though it's still 31 May in UTC", () => {
    expect(londonMonthKey(new Date("2026-05-31T23:30:00Z"))).toBe("2026-06");
  });
  it("a capped business pays 30p again on the 1st", () => {
    const c = new BookingFeeCounter();
    chargeN(c, 100, new Date("2026-10-20T12:00:00Z"));
    expect(c.usedIn("2026-10")).toBe(2500);
    expect(c.charge("nov-1", 2000, new Date("2026-11-01T00:30:00Z"))).toBe(30);
    expect(c.usedIn("2026-11")).toBe(30);
  });
});

describe("refunds and once-per-booking", () => {
  it("a refunded booking still counts toward the cap", () => {
    const c = new BookingFeeCounter();
    chargeN(c, 83);
    c.refund("b1");
    expect(c.usedIn("2026-11")).toBe(2490);
    expect(c.charge("b84", 2000, nov)).toBe(10);
  });
  it("deposit + balance on one booking charges 30p once", () => {
    const c = new BookingFeeCounter();
    expect(c.charge("booking-1", 1000, nov)).toBe(30); // deposit
    expect(c.charge("booking-1", 3000, nov)).toBe(0);  // later balance payment
    expect(c.usedIn("2026-11")).toBe(30);
  });
  it("a deposit smaller than the fee: fee never exceeds the charge, application fee never exceeds the charge", () => {
    expect(bookingFeeForCharge({ feeMinor: 30, capMinor: 2500, usedThisMonthMinor: 0, chargeMinor: 20 })).toBe(20);
    const plan = planApplicationFee({ chargeMinor: 40, platformFeeMinor: 30, outstandingMinor: 500 });
    expect(plan.applicationFeeMinor).toBeLessThanOrEqual(40);
    expect(plan.applicationFeeMinor).toBe(40);
  });
  it("application fee = booking fee + 1.5% + 20p + ledger collection", () => {
    const plan = planApplicationFee({ chargeMinor: 2000, platformFeeMinor: 30, outstandingMinor: 100 });
    expect(plan.applicationFeeMinor).toBe(30 + 50 + 100);
  });
});
