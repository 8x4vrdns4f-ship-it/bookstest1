## What's happening

The "Connect Stripe" button calls the `connect-create-account` edge function. The function logs show Stripe rejecting every request with:

> You can only create new accounts if you've signed up for Connect, which you can do at https://dashboard.stripe.com/connect.

That's why the client sees "Edge function returned a non-2xx status code" — the function itself is fine, Stripe is returning 400 because **Stripe Connect has not been activated on your platform Stripe account yet**.

## Fix (no code change needed)

1. Go to https://dashboard.stripe.com/connect/overview while signed into the same Stripe account whose keys are configured here (acct_1TInkZFXQZu4XzM9, live mode).
2. Click **Get started** and complete the short Connect platform onboarding (platform name, business model = "I onboard businesses to accept payments", country, etc.).
3. Once Connect shows as enabled in that dashboard, come back to BookSuite and click **Connect Stripe** again — the same edge function will succeed and return the onboarding URL.

## Why no code change

The error is a platform-level Stripe setting on your account, not something the app can toggle via API. The existing `connect-create-account`, `connect-account-status`, `connect-dashboard-link`, and webhook functions are already correct and will work as soon as Connect is enabled.

If after enabling Connect you still see a non-2xx error, send me the new edge function logs and I'll diagnose from there.