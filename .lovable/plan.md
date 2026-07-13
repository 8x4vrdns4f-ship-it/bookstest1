## Fix gift code generation for subscribers

The **Generate code** button currently fails because the `gift_codes` INSERT policy only allows users with the `admin` role. We'll open it up to any user with an active subscription, add a small monthly cap, and clean up the UI so failures are visible.

### 1. Database — new RLS rules

Replace the admin-only insert policy on `public.gift_codes` with a subscriber policy:

- Allow INSERT when `auth.uid() = created_by` AND `public.get_active_tier(auth.uid()) IS NOT NULL` (existing security-definer function returns the active tier or NULL).
- Keep SELECT limited to the code's own `created_by` (so users see the codes they generated). Admin SELECT policy stays.
- Add a monthly-cap trigger `enforce_gift_code_monthly_limit` on INSERT: raise `TIER_LIMIT_GIFT_CODES` when the user has already created ≥ **5 gift codes** in the current calendar month. (Redeemed or not — counts toward the cap.)

### 2. Frontend — `src/components/dashboard/GiftCodesCard.tsx`

- Keep the current 2-step flow (generate code via RPC → insert row) but surface the real error message from Postgres so the user sees "You need an active plan…" or "Monthly limit reached" instead of a silent failure.
- Add a small helper line under the dialog title: "You can gift up to 5 codes per month. Each code unlocks 30 days of the selected tier."
- After a successful create, auto-select+copy the new code and show it prominently in the toast.
- No change to the redemption flow — `redeem_gift_code` RPC already works and grants 30 days of the code's tier.

### 3. Error toasts

Extend `src/lib/tierError.ts` with:
- `NO_SUBSCRIPTION` → already handled.
- New `TIER_LIMIT_GIFT_CODES` → "You've reached your monthly gift code limit (5). Try again next month."

### Out of scope
- No Stripe charge for gifting (per your call — it's a genuine free gift).
- No changes to `redeem_gift_code`, `Pricing` page, or the redemption UI.
- No changes to subscription tiers or pricing.

### Verification
- Sign in as a subscriber → open Gift Codes → Generate → confirm a `GIFT-XXXXXX` code appears in the list and toast.
- Sign in as a non-subscriber → Generate → confirm friendly "subscription required" toast, no row created.
- Generate 6 codes as a subscriber → 6th call shows the monthly-limit toast.
- Redeem a code from a second account → confirm 30-day subscription is granted.
