# Fix gift code generation for owners

## Status check

The gift code feature (owner generates a code -> recipient redeems 30 days of a plan) is **not working right now**.

Evidence from the live database:
- 3 codes exist in total, 2 redeemed. The most recent one was created on 27 Jul 2026.
- On 7 Aug 2026 a security pass revoked permission to run the plan-tier lookup (`get_active_tier`) for logged-in users.
- The rule that allows a gift code row to be saved ("Subscribers can create gift codes") calls that exact lookup, and that rule runs with the logged-in user's permissions.

Result: since 7 Aug, pressing "Create code" fails with a permission error. Everything else in the chain is fine — the code generator function, the redeem function, and the read rules are all correctly permitted.

Redemption is unaffected: `redeem_gift_code` runs with elevated privileges and is still granted to logged-in users.

## Fix

1. Change the gift code insert rule so it no longer calls the restricted lookup directly. Instead, wrap the check in a small dedicated security-definer helper (`can_create_gift_code()`) that returns true when the caller has an active plan. Grant execute on that helper to logged-in users only.
2. Recreate the "Subscribers can create gift codes" policy to use the helper, keeping the same two conditions: the row must be created by the caller, and the caller must have an active plan.
3. Leave `get_active_tier` locked down as the security scan requires — the helper exposes only a yes/no answer, not the tier.
4. Re-check the monthly cap trigger (max 5 codes per month) still fires correctly after the policy change.

## Verification

- Generate a code from the dashboard Gift Codes card as an owner with an active plan and confirm it saves and appears in the list.
- Confirm a user without an active plan is still blocked.
- Redeem a freshly created code and confirm 30 days of access is granted.

## Technical notes

- One migration: create `public.can_create_gift_code()` (security definer, `search_path = public`, `REVOKE ... FROM PUBLIC, anon`, `GRANT EXECUTE ... TO authenticated`), then `DROP POLICY` / `CREATE POLICY` on `public.gift_codes` for INSERT to `authenticated` with `WITH CHECK (auth.uid() = created_by AND public.can_create_gift_code())`.
- No frontend changes needed; `GiftCodesCard.tsx` and `GiftCodeRedeem.tsx` stay as-is.
