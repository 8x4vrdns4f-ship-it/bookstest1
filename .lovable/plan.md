## Fix "Cancel Subscription" for gift-code users

**Root cause**: Your active plan came from a redeemed gift code (`price_id = gift_platinum`), so there is no Stripe customer or Stripe subscription attached. Both `cancel-subscription` and `apply-retention` try to look up the customer in Stripe and throw "No Stripe customer found", which the UI surfaces as an invalid/error toast. Same failure will hit any user on a gifted plan.

## Changes

### 1. `supabase/functions/cancel-subscription/index.ts`
- After loading the user, first read `public.subscriptions` for that `user_id`.
- If the row has no `stripe_subscription_id` (i.e. it's a gift/manual sub):
  - Skip all Stripe calls.
  - Update the row: `subscribed = false`, `status = 'canceled'`, `canceled_at = now()`, `current_period_end = now()`, `tier` preserved.
  - Still fire the `subscription-canceled` transactional email (best-effort), using tier from the DB row and an idempotency key like `cancel-gift-<user_id>-<timestamp>`.
  - Return `{ ok: true, giftCanceled: true }`.
- Otherwise, keep the existing Stripe cancel path unchanged.

### 2. `supabase/functions/apply-retention/index.ts`
- Same guard: if the subscription row has no `stripe_subscription_id`, return a clear error `{ error: "Retention discount isn't available for gifted plans." }` (400) instead of hitting Stripe. That keeps the "10% off forever" flow honest — gift subs are already free.

### 3. `src/components/dashboard/CancelSubscriptionDialog.tsx`
- Read `priceId` (or a new `isGift` flag) from `useSubscription()`. A subscription is a gift when `price_id` starts with `gift_` OR `stripe_subscription_id` is null.
- When `isGift` is true:
  - Skip the retention step entirely — jump straight to the confirm step.
  - Change confirm copy to gift-appropriate wording: "This will end your gifted Platinum access immediately. You can redeem another gift code or subscribe on the Pricing page later."
  - Remove the "20% off winback code" line for gift users.
- Non-gift users see the existing retention → confirm flow unchanged.

### 4. `src/hooks/useSubscription.tsx` (minor)
- Expose `priceId` (and derived `isGift`) alongside the existing fields so the dialog can branch. No behaviour change for other consumers.

## Verification

1. As the current gift-code user (`tzdabest@proton.me`): open dashboard → Cancel Subscription → confirm → toast "Subscription canceled", access removed, redirected to `/pricing`. Row in `subscriptions` shows `subscribed=false, status=canceled`.
2. As a paying Stripe user: retention offer still shows first, both "Claim 10% off" and "Yes, cancel" continue to work end-to-end.
3. `apply-retention` invoked on a gift sub returns the friendly "not available for gifted plans" toast instead of the current 500.

No database migration needed.