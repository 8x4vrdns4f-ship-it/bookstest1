// Subscription plan prices (pure — unit-tested from src/test/planPrices.test.ts).
// The IDs are Stripe lookup keys, identical in test and live.
// Amounts in pence: Silver £25/mo, £250/yr · Gold £59/mo, £590/yr · Platinum £199/mo, £1,990/yr.

export type PlanTier = "silver" | "gold" | "platinum";
export type Billing = "monthly" | "yearly";

export const PLAN_PRICES: Record<string, { tier: PlanTier; billing: Billing; amountMinor: number }> = {
  silver_monthly: { tier: "silver", billing: "monthly", amountMinor: 2500 },
  silver_yearly: { tier: "silver", billing: "yearly", amountMinor: 25000 },
  gold_monthly: { tier: "gold", billing: "monthly", amountMinor: 5900 },
  gold_yearly: { tier: "gold", billing: "yearly", amountMinor: 59000 },
  platinum_monthly: { tier: "platinum", billing: "monthly", amountMinor: 19900 },
  platinum_yearly: { tier: "platinum", billing: "yearly", amountMinor: 199000 },
};

/** Lookup key for a plan + billing period ("annual" is accepted for "yearly"). */
export function planLookupKey(tier: unknown, billing: unknown = "monthly"): string | null {
  if (tier !== "silver" && tier !== "gold" && tier !== "platinum") return null;
  const b = billing === "yearly" || billing === "annual" ? "yearly" : billing === "monthly" || billing == null ? "monthly" : null;
  if (!b) return null;
  return `${tier}_${b}`;
}

/** Which plan a Stripe price belongs to (monthly and yearly map to the same tier). */
export function tierForPrice(p: { lookupKey?: string | null; externalId?: string | null; subscriptionTier?: string | null }): PlanTier | null {
  for (const key of [p.lookupKey, p.externalId]) {
    if (key && PLAN_PRICES[key]) return PLAN_PRICES[key].tier;
  }
  const t = p.subscriptionTier ? String(p.subscriptionTier).toLowerCase() : null;
  return t === "silver" || t === "gold" || t === "platinum" ? t : null;
}
