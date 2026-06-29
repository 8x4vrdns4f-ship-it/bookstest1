## What's actually happening

The edge function is working. The 500 the customer sees comes from Stripe itself, returned to your function:

> "Please review the responsibilities of managing losses for connected accounts."

Stripe requires every platform to acknowledge **loss liability** on its Connect platform profile in **live mode** before it will let you create any connected accounts. Until you do that, every customer who clicks "Connect Stripe" on the live site will see "Edge Function returned a non‑2xx status code", because Stripe rejects the `accounts.create` call with HTTP 400.

This is a one‑time setting in your Stripe dashboard — not a code bug. Test mode worked because test mode doesn't enforce it.

## What you need to do (no code change, ~2 minutes)

1. Open `https://dashboard.stripe.com/settings/connect/platform-profile` while logged in as the **platform** Stripe account (the BookSuite account, not a customer's account).
2. Make sure the toggle in the top‑right of the dashboard is set to **Live mode** (not Test mode).
3. Complete every section that shows a warning. The one Stripe is blocking on is **"Responsibilities for managing losses"** — pick who covers negative balances on connected accounts (for a destination‑charges model like BookSuite, the platform usually accepts liability).
4. Save. Then go back to BookSuite on the other device and click **Connect Stripe** again.

## Small code improvement I'll make at the same time

Right now the dashboard just shows the generic "Edge Function returned a non‑2xx status code". I'll update `connect-create-account` (and the matching `PaymentsCard` toast) so that when Stripe returns a structured error like this one, the user sees Stripe's actual message (e.g. "Please review the responsibilities of managing losses…") plus a hint that it's a platform‑side setting, not their fault. That way if anything similar happens in future you'll know exactly which Stripe setting to fix without having to read edge function logs.

### Files touched

- `supabase/functions/connect-create-account/index.ts` — catch `StripeInvalidRequestError` and forward `error.raw.message` in the JSON response with a 400 status.
- `supabase/functions/connect-account-status/index.ts` and `connect-dashboard-link/index.ts` — same treatment for consistency.
- `src/components/dashboard/PaymentsCard.tsx` — already uses `getConnectErrorMessage`, so it will pick up the clearer message automatically; I'll just prepend "Stripe: " so it's obvious where the message came from.

No database, schema, or auth changes.

## Why I'm confident this is the cause

Edge function logs for `connect-create-account` show, at the time the other device tried:

```
StripeInvalidRequestError
statusCode: 400
message: "Please review the responsibilities of managing losses for connected accounts…"
x-stripe-routing-context-priority-tier: "livemode"
```

The request reached Stripe in live mode with valid credentials; Stripe refused it because the platform profile is incomplete.
