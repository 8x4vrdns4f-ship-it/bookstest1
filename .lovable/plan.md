
## Goal

Change the booking widget so the customer enters their card **inside the widget** at request time, but the deposit is only **charged if the business accepts** the booking. If the business declines (or the charge later fails), the customer is never charged.

## New end-to-end flow

```text
Customer                Widget / Elements        Edge functions              Business dashboard
--------                -----------------        ----------------            -------------------
Fill details      -->   Card entered inline
                        (Stripe Payment Element)
Press "Request"   -->   create-booking-intent  --> creates Stripe Customer
                                                   + SetupIntent (off_session)
                                                   returns client_secret
                        stripe.confirmSetup()  --> card saved as PaymentMethod
                                                   (no charge)
                        create pending_bookings row with:
                        stripe_customer_id, payment_method_id, setup_intent_id
                        status = 'awaiting_owner'
Success screen    <--                                                        New request appears
                                                                             in "Pending requests"

                                                 Owner clicks Accept   -->  charge-booking-deposit
                                                 Off-session PaymentIntent
                                                 (Connect: transfer_data +
                                                 application_fee_amount)
                                                 - success -> promote to bookings, email both sides
                                                 - requires_action / fail ->
                                                   keep pending, email customer
                                                   a one-click checkout fallback link

                                                 Owner clicks Decline  -->  detach PaymentMethod,
                                                                            delete pending row,
                                                                            email customer
```

## Scope of changes

### 1. Widget (`src/lib/widgetTemplate.ts`)
- Load `https://js.stripe.com/v3/` inside the iframe `srcDoc`.
- After settings load, fetch the business's Stripe **publishable key + connected account id** from a small new public RPC (`get_widget_payment_config(user_id)`).
- Mount Stripe **Payment Element in `mode: 'setup'`** below the "Your details" section (label: "Payment details — you'll only be charged if the booking is accepted").
- On submit:
  1. Call new edge function `create-booking-intent` -> returns `{ setup_client_secret, customer_id, publishable_key }`.
  2. `stripe.confirmSetup({ elements, clientSecret, redirect: 'if_required' })`.
  3. Post the returned `payment_method_id` + booking details to `save-pending-booking` -> creates the `pending_bookings` row.
  4. Show the existing "Booking requested" success screen. No redirect off the host site.

### 2. New / changed edge functions
- **`create-booking-intent`** (new, public): validates fields (reuse validation from `create-booking-checkout`), resolves-or-creates a Stripe Customer on the platform account with `metadata.user_id/business_id`, creates a SetupIntent with `usage: 'off_session'`, `payment_method_types: ['card']`, and `on_behalf_of` = connected account so the card is usable through Connect.
- **`save-pending-booking`** (new, public): after client-side confirmSetup, inserts a `pending_bookings` row with `stripe_customer_id`, `payment_method_id`, `setup_intent_id`, `status = 'awaiting_owner'`. Emails the owner "new request received".
- **`charge-booking-deposit`** (new, owner-authed): called from the dashboard Accept action. Creates a PaymentIntent with `confirm: true`, `off_session: true`, `customer`, `payment_method`, `application_fee_amount`, `transfer_data.destination`, then on success promotes `pending_bookings` -> `bookings` (status `confirmed`), stores `payment_intent_id`/`charge_id`, and sends confirmation emails. On `requires_action` or card failure it keeps the row pending and triggers a fallback email with a hosted Checkout link (reuses current `create-booking-checkout`).
- **`decline-pending-booking`** (new, owner-authed): detaches the PaymentMethod, deletes the pending row, sends the decline email.
- **Delete/deprecate**: `create-booking-checkout` stays only as the fallback-link generator for the SCA-retry case; `verify-booking-payment` stays for that same path. `refund-booking-deposit` is no longer part of the accept/decline path (kept for post-confirmation refunds).

### 3. Database (`pending_bookings` and `bookings`)
Migration adds:
- `pending_bookings.stripe_customer_id text`
- `pending_bookings.payment_method_id text`
- `pending_bookings.setup_intent_id text`
- `pending_bookings.status text default 'awaiting_owner'` (values: `awaiting_owner`, `charging`, `failed`, `declined`)
- Index on `(user_id, status)` for the dashboard queue.

No changes to `bookings`; it still receives `stripe_payment_intent_id`/`stripe_charge_id` on accept.

### 4. Dashboard
- Existing pending-bookings UI keeps its Accept / Decline buttons; they now call `charge-booking-deposit` / `decline-pending-booking` instead of just flipping a status.
- Accept button shows a spinner while the off-session charge runs and surfaces "Card needs verification — customer emailed a payment link" if the PI comes back `requires_action`.

### 5. Public booking success/cancel pages
- `/book/:userId/success` is repurposed for the SCA fallback path only. The primary path now shows the success state inline in the widget without navigation.

## Technical notes / risks

- **Off-session charge failures**: cards can decline or require SCA when charged later. The fallback (email the customer a hosted Checkout link that reuses the existing `create-booking-checkout`) covers both.
- **Connect authorization**: SetupIntents created on the platform account with `on_behalf_of` + the resulting PaymentIntent using `transfer_data.destination` is the Stripe-supported path for saving a card once and charging later on behalf of a connected account.
- **Publishable key exposure**: safe to return from the widget config RPC (it's publishable).
- **Currency / deposit amount**: read from `business_settings` at accept time (not save time), so owners changing the deposit before accepting is honored. If we'd rather lock the amount at request time, we store `deposit_amount` on `pending_bookings` (already the case) and use that instead.

## Open decisions

1. Deposit amount: lock at **request time** (what the customer saw) or use the **current** setting at accept time? Recommendation: lock at request time.
2. Auto-expire pending requests after N hours (e.g. 48h) with an automatic decline + email? Recommendation: yes, 48h.

I'll assume "lock at request time" and "auto-expire at 48h" unless you say otherwise when approving.
