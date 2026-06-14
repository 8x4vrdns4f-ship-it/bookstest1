## Fix ambiguous `current_period_end` in `redeem_gift_code`

The function declares `RETURNS TABLE(tier text, current_period_end timestamptz)`, which creates output parameters with the same names as columns on `public.subscriptions`. Inside the `EXISTS` check and the `INSERT … ON CONFLICT` block, Postgres can't tell whether `current_period_end` refers to the OUT parameter or the table column → error.

### Single migration

Recreate `public.redeem_gift_code(p_code text)` with:

- Renamed OUT columns: `out_tier text`, `out_period_end timestamptz` (no clash with any table column).
- Fully-qualify every column reference inside the body (`subscriptions.current_period_end`, `subscriptions.price_id`, `subscriptions.user_id`, `subscriptions.subscribed`).
- Keep all existing behaviour: auth check, row lock, INVALID_CODE / ALREADY_USED / ACTIVE_GIFT errors, mark code redeemed, upsert 30-day subscription row, return tier + end date.
- `SECURITY DEFINER`, `SET search_path = public`, `GRANT EXECUTE … TO authenticated`.

### Frontend

`GiftCodeRedeem.tsx` currently reads `row?.tier`. Update that one line to `row?.out_tier` so the success toast still shows the tier. No other UI changes.

### Make `GIFT-76ZCCW` redeemable again

It was never successfully redeemed (function aborted), so `redeemed_by` / `redeemed_at` are already null and it is usable as-is once the function is fixed. No data change needed. (If a check shows it was partially marked, a follow-up `UPDATE public.gift_codes SET redeemed_by = NULL, redeemed_at = NULL WHERE code = 'GIFT-76ZCCW'` will reset it.)

### Verification

After approval: open `/pricing` while logged in, enter `GIFT-76ZCCW`, click Redeem → expect success toast "Gift redeemed! You now have 30 days of PLATINUM access." and redirect to `/dashboard`; `subscriptions` row for the user shows `tier='platinum'`, `price_id='gift_platinum'`, `current_period_end ≈ now + 30 days`.
