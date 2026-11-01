# Part 1 read-only check: findings (nothing changed)

## 1. Old fee references
**Code (src, all edge functions, scripts):** no hits for tier_fee_percent, is_founding_discount_active, resolveFeePercent, resolveBaseFeePercent, TIER_FEE_PERCENT, DEFAULT_FEE_PERCENT or feePercent. That covers the admin, business-assistant, embed-assistant, mcp, analytics and ledger/invoice functions.

**platform_fee_percent** is an old column on business_settings, and it's still there. Nothing reads it to work out a fee any more. It shows up in:
- **The generated type definitions** (3 hits): harmless.
- **The database function `guard_business_settings_financial_update`**: it only blocks non-owners from changing that column. It won't error and gives no wrong number. It's just dead weight.

**Live database:** no function, view or cron job calls `tier_fee_percent` or `is_founding_discount_active`, so dropping them breaks nothing. Both are confirmed gone.

**One wrong number found (not on your list):** `admin_platform_stats` works out the admin "monthly revenue" estimate with Silver at £20. It also ignores annual plans. It won't error, but the admin figure will be wrong.

## 2. Other places that take money
Only four places create a Stripe charge:
- **charge-booking-deposit** (approving a booking request): goes through the fee counter as `pending-<id>`.
- **create-booking-checkout** (pay now): goes through the fee counter as `pending-<id>`.
- **create-checkout**: subscriptions only, not bookings.
- **collect-ledger-balances**: adds money a business owes BookSuite to its own subscription invoice. It's not a booking payment, so correctly no booking fee.

There is no balance payment, remaining-amount payment or manual charge. The balance is "due on the day" and is paid outside BookSuite.

## 3. Live Stripe prices
What live has now (read only):
- silver_monthly £20, gold_monthly £59, platinum_monthly £199, each marked as managed by Lovable.
- Three old untagged prices: £199 "Silver Plan", £589 "Gold tier", £1,149 "Platinum".

**Before Publish:**
- The live site still shows the old pricing page, which only offers monthly.
- The server already uses the same price codes, which exist in live.
- So live checkout keeps working at the old live amounts: Silver £20, Gold £59, Platinum £199.
- Annual codes don't exist in live yet. Live can't send an annual request until Publish, because the switch isn't published.

**On Publish:** Lovable copies the test-mode catalogue to live by matching codes.
- **Expected:** silver_monthly moves to a new £25 price and the old £20 is retired. Gold and Platinum monthly get fresh copies at the same amounts. Three yearly prices are created.
- **Not verified:** I can't confirm the order, or that the £20 price is archived rather than just losing its code.
- **The gap:** if the website updates before the prices finish copying, checkout would show "Price not found" for a moment. This mainly affects annual plans.
- **The three untagged old prices:** not covered by the copy, so they stay active. Nothing uses them, though.

**Recommended after Publish:**
1. Re-read the live prices to confirm six active priced plans and £20 gone.
2. Archive the three untagged old prices.
3. Fix the admin revenue figure (£25 Silver, and annual plans counted as a twelfth per month).

## 4. Database change 0024
It ran. All of these are in the live database:
- **New functions:** reserve_booking_fee, confirm_booking_fee, release_booking_fee, release_stale_booking_fees, booking_fee_tier, booking_fee_month, tier_booking_fee_minor, tier_booking_fee_cap_minor, mark_founding_member.
- **New tables:** booking_fee_months, booking_fee_charges, founding_members.
- **Trigger:** trg_mark_founding_member.
- **Removed:** tier_fee_percent and is_founding_discount_active.
- **Also proven:** the earlier live tests against the database passed.
