# Stripe Webhooks + Booking Confirmation Emails

## Goal

Right now, a booking is only created in the database if the customer's browser successfully makes it back to `/book/:userId/success` after Stripe Checkout. If they close the tab, lose signal, or their bank takes a moment to settle — Stripe takes the money but your app never knows. This plan fixes that by:

1. Having **Stripe tell your server directly** ("webhook") when a payment succeeds or a refund happens.
2. **Automatically emailing** the customer (and the business owner) once payment is confirmed.
3. Doing the same for refunds.

The browser-based success page stays — it just becomes a "thank you" screen, not the source of truth.

---

## What gets built

### 1. Stripe webhook endpoint (`stripe-connect-webhook` edge function)

A public endpoint Stripe calls server-to-server. It verifies the request really came from Stripe (using a signing secret), then handles three event types:

- **`checkout.session.completed`** → look up the matching `pending_bookings` row, promote it into `bookings` with `payment_status = 'paid'`, then trigger the customer + owner emails. Idempotent (safe if Stripe retries).
- **`charge.refunded`** → find the booking by payment intent, set `payment_status = 'refunded'`, save `refund_id`, trigger the refund email.
- **`account.updated`** (Connect) → update the business owner's `connect_accounts` row (`charges_enabled`, `payouts_enabled`, `details_submitted`) so the Payments page shows live status without them clicking "refresh".

### 2. Register the webhook with Stripe

Use Stripe's API to register the endpoint URL once per environment (sandbox + live). Stripe gives back a signing secret which gets stored as `STRIPE_CONNECT_WEBHOOK_SECRET`.

### 3. Three email templates (using your existing Lovable email system)

Built as branded React Email templates matching your dark-blue BookSuite look:

- **`booking-paid-customer`** — "Your booking with [Business Name] is confirmed." Includes date, time, service, confirmation code, deposit amount paid, business address.
- **`booking-new-owner`** — "New booking: [Client Name] booked [Service]." Sent to the business owner's email so they know money came in. Respects their existing `notify_new_booking` toggle in `business_settings`.
- **`booking-refunded-customer`** — "Your deposit has been refunded." Includes booking details and refund amount.

All three are triggered by the webhook (server-side), not the browser, so they fire even if the customer never sees the success page.

### 4. Tighten the success/cancelled pages

The existing `/book/:userId/success` page keeps calling `verify-booking-payment` as a fast-path (so the customer sees confirmation immediately instead of waiting for the webhook). Both paths are idempotent — whichever finishes first wins, the other becomes a no-op.

---

## Technical details

### Files created
- `supabase/functions/stripe-connect-webhook/index.ts` — webhook handler
- `supabase/functions/_shared/transactional-email-templates/booking-paid-customer.tsx`
- `supabase/functions/_shared/transactional-email-templates/booking-new-owner.tsx`
- `supabase/functions/_shared/transactional-email-templates/booking-refunded-customer.tsx`
- Page at `/unsubscribe` (required by the email system if not already present)

### Files edited
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register 3 new templates
- `supabase/functions/verify-booking-payment/index.ts` — make idempotent with webhook (use upsert on `stripe_checkout_session_id`, also send emails if it wins the race)
- `supabase/functions/refund-booking-deposit/index.ts` — same idempotency note; emails moved to webhook so they fire regardless of trigger source
- `supabase/config.toml` — add `[functions.stripe-connect-webhook]` with `verify_jwt = false` (Stripe doesn't send a JWT)

### Database
- Small migration: add unique index on `bookings.stripe_checkout_session_id` (for upsert idempotency) and on `bookings.stripe_payment_intent_id` (for refund lookup).
- No new tables needed.

### Secrets
- `STRIPE_CONNECT_WEBHOOK_SECRET` — gathered after webhook is registered with Stripe. I'll request this via the secrets tool at the right moment.

### Email prerequisites
Your project already has the email infrastructure (`email_send_log`, queues, etc.) — I just need to confirm the sender domain is set up. If it isn't yet, I'll surface the email domain setup dialog as the first step.

### Order of work
1. Verify email domain status; if missing, prompt setup.
2. Create the 3 email templates + register them.
3. Create `stripe-connect-webhook` edge function (Connect-aware, handles all 3 event types).
4. Add unique indexes for idempotency.
5. Register the webhook with Stripe via API, store the signing secret.
6. Wire the webhook to call `send-transactional-email` for each event.
7. Make `verify-booking-payment` + `refund-booking-deposit` race-safe with the webhook.
8. End-to-end test in sandbox: pay → check email + booking created; refund → check email + status updated.

---

## What you'll see when it's done

- Customer pays the deposit on any embedded widget → within ~2 seconds, both they and you get a confirmation email, and the booking appears in your dashboard. Closing the browser doesn't break this anymore.
- You refund a deposit (from the booking detail dialog or directly in Stripe) → customer gets a refund email automatically, booking shows `refunded` status.
- Business owners finishing Connect onboarding no longer need to click "refresh status" — it updates itself.
