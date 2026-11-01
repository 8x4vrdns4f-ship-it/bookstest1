import { describe, it, expect } from "vitest";
import { PLAN_PRICES, planLookupKey, tierForPrice } from "../../supabase/functions/_shared/plan-prices";
import { TIER_LIMITS } from "@/lib/tierLimits";

describe("subscription prices", () => {
  it("amounts: Silver £25/£250, Gold £59/£590, Platinum £199/£1,990", () => {
    expect(PLAN_PRICES.silver_monthly.amountMinor).toBe(2500);
    expect(PLAN_PRICES.silver_yearly.amountMinor).toBe(25000);
    expect(PLAN_PRICES.gold_monthly.amountMinor).toBe(5900);
    expect(PLAN_PRICES.gold_yearly.amountMinor).toBe(59000);
    expect(PLAN_PRICES.platinum_monthly.amountMinor).toBe(19900);
    expect(PLAN_PRICES.platinum_yearly.amountMinor).toBe(199000);
  });
  it("annual = 10 months' price, shown prices match", () => {
    for (const t of ["silver", "gold", "platinum"] as const) {
      expect(PLAN_PRICES[`${t}_yearly`].amountMinor).toBe(PLAN_PRICES[`${t}_monthly`].amountMinor * 10);
      expect(TIER_LIMITS[t].monthlyPriceGbp * 100).toBe(PLAN_PRICES[`${t}_monthly`].amountMinor);
      expect(TIER_LIMITS[t].yearlyPriceGbp * 100).toBe(PLAN_PRICES[`${t}_yearly`].amountMinor);
    }
  });
  it("monthly and annual prices map to the right plan", () => {
    expect(tierForPrice({ lookupKey: "silver_monthly" })).toBe("silver");
    expect(tierForPrice({ lookupKey: "silver_yearly" })).toBe("silver");
    expect(tierForPrice({ lookupKey: "gold_monthly" })).toBe("gold");
    expect(tierForPrice({ lookupKey: "gold_yearly" })).toBe("gold");
    expect(tierForPrice({ lookupKey: "platinum_monthly" })).toBe("platinum");
    expect(tierForPrice({ lookupKey: "platinum_yearly" })).toBe("platinum");
    expect(tierForPrice({ lookupKey: null, externalId: "gold_yearly" })).toBe("gold");
    expect(tierForPrice({ lookupKey: "unknown" })).toBeNull();
  });
  it("checkout picks the right lookup key", () => {
    expect(planLookupKey("gold")).toBe("gold_monthly");
    expect(planLookupKey("gold", "yearly")).toBe("gold_yearly");
    expect(planLookupKey("platinum", "annual")).toBe("platinum_yearly");
    expect(planLookupKey("diamond", "monthly")).toBeNull();
    expect(planLookupKey("silver", "weekly")).toBeNull();
  });
});
