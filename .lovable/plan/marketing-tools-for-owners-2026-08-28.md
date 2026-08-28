# Marketing tools for owners

Help businesses fill their calendar with three features, built in this order.

## 1. Rebooking reminders (automated win-back)

Automatically email clients who haven't booked in a while.

- New `business_settings` fields: `rebooking_reminder_enabled` (bool, default off), `rebooking_reminder_days` (int, default 60).
- Daily cron job finds clients whose last completed booking is older than the business's threshold and who haven't been reminded in 90 days, then queues a friendly "we miss you — book again" email with a direct link to the business's booking page.
- Tracks sends in a `rebooking_reminders` log table so no client gets spammed.
- Toggle + day-threshold control in Settings, next to the existing review/reminder toggles.

## 2. Email campaigns to clients

Let owners send one-off announcements (seasonal offers, new services, holiday hours) to their client list.

- New `campaigns` table: subject, body, status (draft/sending/sent), audience counts.
- New dashboard page `/dashboard/campaigns`: list of past campaigns with open/send counts, plus a compose screen (subject, message, preview).
- Audience = the business's clients from past bookings, excluding anyone who unsubscribed (the existing email-suppression/unsubscribe pipeline is reused).
- Sending goes through the existing transactional email queue in batches, with a new campaign email template. Recipients are BCC-style individual sends — no client ever sees another client's address.
- Rate-limited and tier-aware: campaigns are a Gold+ feature, matching the tier differentiation plan.

## 3. Promo codes

Discount codes the business hands out to customers, applied at booking payment.

- New `promo_codes` table per business: code (e.g. SUMMER10), percent-off or fixed-amount, expiry date, max uses, active flag.
- Manage UI in Settings or the dashboard: create, deactivate, see usage counts.
- The public widget gets an optional "promo code" field at the payment step; a new RPC validates the code (active, not expired, under use limit, belongs to this business) and returns the discounted amount.
- The booking checkout edge functions apply the discount when creating the Stripe payment and record the redemption atomically.
- Gold+ feature, gated like campaigns.

## Technical notes

- All new tables: RLS enabled, explicit GRANTs, owner-scoped policies; validation RPCs are security-definer with tight input checks.
- Emails reuse the existing queue/template/suppression infrastructure — no new email provider.
- Cron: one daily job for rebooking reminders alongside the existing reminder jobs.
- Stripe: discount applied by computing the adjusted amount server-side before PaymentIntent creation — never trust the client's figure.
- Public widget changes stay backwards-compatible: businesses without the feature see no promo field.
- Verify end-to-end in the preview: enable reminders, compose + send a test campaign, create a code and book with it at the discounted price.
