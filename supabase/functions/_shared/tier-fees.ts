// Platform transaction fee per subscription tier.
// Must stay in sync with public.tier_fee_percent() in the database and with
// the fee figures advertised on the pricing page (src/pages/Pricing.tsx).
export const TIER_FEE_PERCENT: Record<string, number> = {
  silver: 12.5,
  gold: 5.0,
  platinum: 2.0,
};

export const DEFAULT_FEE_PERCENT = 12.5;

/**
 * Resolve the platform fee percentage for a business owner from their active
 * subscription tier. Falls back to the highest (Silver) rate when no active
 * tier is found, so the platform is never under-charged by accident.
 */
export async function resolveFeePercent(
  admin: { from: (t: string) => any },
  userId: string,
): Promise<number> {
  const { data } = await admin
    .from("subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", userId)
    .eq("subscribed", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tier = data?.tier ? String(data.tier).toLowerCase() : null;
  if (!tier) return DEFAULT_FEE_PERCENT;
  return TIER_FEE_PERCENT[tier] ?? DEFAULT_FEE_PERCENT;
}
