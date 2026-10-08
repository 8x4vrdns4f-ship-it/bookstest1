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
  it("no plan gets no paid features", () => {
    expect(tierAllows(null, "reviews")).toBe(false);
    expect(tierAllows("silver", "waitlist")).toBe(false);
    expect(tierAllows("gold", "waitlist")).toBe(true);
  });
});
