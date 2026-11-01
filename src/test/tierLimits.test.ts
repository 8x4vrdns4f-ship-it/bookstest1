import { describe, it, expect } from "vitest";
import { TIER_LIMITS, tierAllows } from "@/lib/tierLimits";

describe("plan rules", () => {
  it("AI assistant allowance per month", () => {
    expect(TIER_LIMITS.silver.assistantRequestsPerMonth).toBe(20);
    expect(TIER_LIMITS.gold.assistantRequestsPerMonth).toBe(100);
    expect(TIER_LIMITS.platinum.assistantRequestsPerMonth).toBe(500);
  });
  it("promo codes capped Silver 0, Gold 1, Platinum 2", () => {
    expect([TIER_LIMITS.silver.promoCodesMax, TIER_LIMITS.gold.promoCodesMax, TIER_LIMITS.platinum.promoCodesMax]).toEqual([0, 1, 2]);
  });
  it("Silver: 3 staff, unlimited services, 100 bookings a month", () => {
    expect(TIER_LIMITS.silver.staff).toBe(3);
    expect(TIER_LIMITS.silver.services).toBeNull();
    expect(TIER_LIMITS.silver.bookingsPerMonth).toBe(100);
  });
  it("no plan offers SMS reminders", () => {
    expect([tierAllows("silver", "smsReminders"), tierAllows("gold", "smsReminders"), tierAllows("platinum", "smsReminders")]).toEqual([false, false, false]);
  });
  it("no plan gets no paid features", () => {
    expect(tierAllows(null, "reviews")).toBe(false);
    expect(tierAllows("silver", "waitlist")).toBe(false);
    expect(tierAllows("gold", "waitlist")).toBe(true);
  });
});
