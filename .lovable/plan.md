# Stripe Connect for Per-Business Deposits + Platform Fees

Right now the widget creates bookings with no money attached. This plan wires up Stripe Connect (Express accounts) so:
- Each business owner connects their own Stripe account from the dashboard.
- The widget collects the deposit at booking time, routed to the business's Stripe account.
- BookSuite automatically takes its `platform_fee_percent` (already on `business_settings`) from every deposit.
- Bookings are only created in the database once payment succeeds (no payment = no booking, no calendar clutter).

## How it works (user-facing)

**For business owners:**
1. Dashboard gets a new "Payments" card. Status: *Not connected → Connect Stripe → Onboarding → Active*.
2. Clicking "Connect Stripe" opens Stripe's hosted Express onboarding (name, bank, ID). On return, status flips to Active.
3. They see their connected account, payout status, and a "Manage on Stripe" button (Stripe Express dashboard link).
4. Until they're connected, the embed widget shows "This business hasn't enabled online deposits yet — please contact them to book." (Owner also sees a banner in dashboard prompting them to connect.)

**For end customers booking through the widget:**
1. Pick date/time/duration, enter name+email, click *Request Booking*.
2. Redirected to Stripe Checkout (hosted) showing `Deposit — £X to {Business Name}`.
3. On success → booking row inserted as `pending` (or `confirmed` if `auto_confirm`), confirmation email sent, redirected back to a "Booking confirmed" screen.
4. On cancel → returned to widget, no booking created.

## Money flow

- Checkout Session uses `payment_intent_data.application_fee_amount` + `transfer_data.destination = <connected acct>`.
- Customer pays £deposit. Stripe routes `deposit - (deposit * platform_fee_percent/100)` to the business. The platform fee lands in BookSuite's Stripe balance.
- Stripe's own processing fees come out of the business's share (standard Connect destination-charges behaviour). We surface this clearly on the Payments page.

## Refunds / cancellations

- When a booking is cancelled or declined, the owner gets a "Refund deposit?" prompt. If yes, we call `refunds.create` with `refund_application_fee: true` and `reverse_transfer: true` so both the business and BookSuite are debited proportionally.

## Database changes

New table `connect_accounts`:
- `user_id` (unique, FK auth.users)
- `stripe_account_id`
- `charges_enabled` boolean
- `payouts_enabled` boolean
- `details_submitted` boolean
- `country`, `default_currency`
- `created_at`, `updated_at`

Adds to `bookings`:
- `stripe_checkout_session_id` text
- `stripe_payment_intent_id` text
- `deposit_amount` numeric(10,2) — captured at time of payment
- `platform_fee_amount` numeric(10,2)
- `payment_status` text default `'unpaid'` (`unpaid | paid | refunded | failed`)
- `refund_id` text

Adds to `business_settings`:
- `require_deposit` boolean default true (lets owners turn off paid bookings later if they want free bookings)

RLS: owners can read their own `connect_accounts`; service role writes via edge function.

## Edge functions (all gateway-routed via `_shared/stripe.ts`)

1. **`connect-create-account`** (auth required) — creates Express account if none, generates an Account Link, returns the URL to redirect to. Sets `country` from `business_settings.currency`/locale.
2. **`connect-account-status`** (auth required) — retrieves the account, upserts `charges_enabled` / `payouts_enabled` / `details_submitted`. Called by dashboard on load and after onboarding return.
3. **`connect-dashboard-link`** (auth required) — returns a Stripe Express dashboard login link.
4. **`create-booking-checkout`** (public, no JWT) — input: `userId, service, date, time, duration, name, email, notes`. Validates business has `charges_enabled`. Creates a *pending* row in a new `pending_bookings` table (TTL'd) holding the booking details + the Checkout Session id. Returns Checkout URL. Uses:
   ```
   payment_intent_data: {
     application_fee_amount: round(deposit * fee_percent),
     transfer_data: { destination: stripe_account_id },
     metadata: { pending_booking_id }
   }
   ```
5. **`stripe-connect-webhook`** (public, signature-verified) — listens for:
   - `checkout.session.completed` → promote `pending_bookings` row into real `bookings`, mark `payment_status='paid'`, fire existing booking-confirmation email.
   - `account.updated` → keep `connect_accounts` in sync.
   - `charge.refunded` → mark booking `payment_status='refunded'`.
   Registered once via Stripe dashboard / API at deploy time; webhook secret stored as `STRIPE_CONNECT_WEBHOOK_SECRET`.
6. **`refund-booking-deposit`** (auth required) — owner-triggered refund.

`pending_bookings` table holds the booking draft for ~24h so we don't pollute `bookings` with unpaid attempts; cleaned up by an existing-style retention job or simple `expires_at` filter.

## Frontend changes

- **`src/pages/Payments.tsx`** (new) — Connect/onboarding card, status badges, balance summary (optional, via `connect-account-status`), Manage-on-Stripe button. Linked from Dashboard.
- **`src/components/dashboard/PaymentsCard.tsx`** — compact card surfaced on Dashboard with current status + CTA.
- **Embed widget (`src/lib/widgetTemplate.ts` + `EmbedWidget.tsx` + `PublicBooking.tsx`)** — submit handler calls `create-booking-checkout` instead of inserting into `bookings`; on success `window.top.location = checkoutUrl`. New success route `/book/:userId/success?session_id=…` polls a tiny edge function to confirm and show the success screen.
- **`EmbedWidgetDialog`** — surface a warning banner if the business isn't payment-connected yet, with a link to `/payments`.
- **`Bookings` management UI** — add "Refund deposit" action on cancel/decline.

## Routes

- `/payments` — Connect dashboard page (auth-gated).
- `/payments/return` — landing after Stripe onboarding; calls `connect-account-status` then redirects to `/payments`.
- `/payments/refresh` — re-creates an Account Link if onboarding link expired.
- `/book/:userId/success` and `/book/:userId/cancelled` — post-Checkout screens.

## Secrets / config

- `STRIPE_SECRET_KEY` is already present (platform account key — confirmed in secrets list).
- New secret: `STRIPE_CONNECT_WEBHOOK_SECRET` (added after we deploy the webhook function and register it).
- No other API keys needed.

## Out of scope (call out, don't build)

- KYC / dispute handling UI beyond the Express dashboard link.
- Multi-currency support beyond what `business_settings.currency` already implies.
- Subscription plan changes (BookSuite's own Stripe subs are unchanged).
- Direct Charges or Separate Charges & Transfers — we're using **Destination Charges** (simplest, business stays merchant of record for the deposit, BookSuite gets the application fee).

## Order of work

1. Migration: `connect_accounts`, `pending_bookings`, booking columns, `require_deposit`.
2. Shared helpers + 6 edge functions.
3. Register Connect webhook, add `STRIPE_CONNECT_WEBHOOK_SECRET`.
4. `/payments` page + Dashboard card.
5. Rewire widget submit → Checkout; add success/cancel routes.
6. Refund button in bookings UI.
7. Smoke test end-to-end in Stripe test mode with one connected sandbox account.

Once you approve I'll move to build mode and execute in that order.