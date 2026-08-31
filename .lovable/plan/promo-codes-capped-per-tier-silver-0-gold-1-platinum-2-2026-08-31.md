# Promo codes: capped per tier (Silver 0 / Gold 1 / Platinum 2)

Promo codes stay in the product for now while you're building, but at launch each tier gets a fixed allowance of active codes: Silver 0, Gold 1, Platinum 2. So the gate moves from a simple on/off feature flag to a per-tier count limit, enforced in the database so it can't be bypassed by calling the API directly.

## What changes

1. **Tier config** (`src/lib/tierLimits.ts`)
   - Replace the `promoCodes` boolean flag with a `promoCodesMax` count: Silver 0, Gold 1, Platinum 2.
   - Keep the feature visible in pricing copy as "1 promo code" (Gold) / "2 promo codes" (Platinum).

2. **Server enforcement** (migration)
   - Extend `tier_allows` / add a `tier_promo_codes_limit(tier)` SQL helper mirroring the existing `tier_services_limit` / `tier_resources_limit` pattern.
   - New `enforce_promo_code_tier_limit` BEFORE INSERT trigger on `promo_codes`: looks up the owner's active tier via `get_active_tier` and rejects the insert once the business already has its tier's allowance of codes. Silver (limit 0) is blocked entirely.

3. **Dashboard UI** (`PromoCodesManager.tsx` + Settings)
   - Gold owners see the manager with a "1 of 1 codes used" indicator; the "New promo code" button is disabled (with an upgrade hint) once they hit their cap.
   - At Platinum, cap of 2 shown the same way.
   - When a code is paused/deactivated it still counts toward the allowance — deleting isn't supported today, so the toggle remains the way to retire one. (If you want delete so owners can swap codes, say so and I'll add it.)
   - Handle the new trigger's error message in the create form ("limit reached") with a friendly toast instead of a raw error.

4. **Widget / checkout**
   - No change needed: `save-pending-booking` already validates codes server-side; if a Silver business somehow has a code (created before launch), the existing `user_tier_allows(..., 'promo_codes')` check already rejects it at booking time. I'll update that check to the new count-based helper so behaviour stays consistent.

## Technical notes

- Follows the existing `enforce_service_tier_limit` / `enforce_resource_tier_limit` trigger pattern — same migration style, GRANTs not needed (trigger function only).
- `tierLimits.ts` and the SQL helper must agree on 0/1/2; both updated in the same pass.
- Existing codes already created during testing are unaffected (trigger is INSERT-only), so nothing breaks mid-build.
