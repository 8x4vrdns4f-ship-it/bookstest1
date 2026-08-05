# Platform owner alerts

Give the BookSuite owner instant email alerts for every business-level event across all
tenants, plus one end-of-day summary of everything that happened.

## Where alerts go

Recommendation: send them to **help@booksuite.online**, not `noreply@` and not your personal
address.

- `noreply@` is a send-only sender identity — replies vanish and mail sent *to* it is
  routinely filtered.
- `help@booksuite.online` is already the inbox you monitor, and it stays yours if you later
  add staff or hand off support.
- Your personal address works, but ties platform ops to one person and mixes business
  alerts into personal mail.

The address is stored as a backend setting (`ADMIN_ALERT_EMAIL`), so you can point it at a
different inbox later without a code change. Set it to `help@booksuite.online`; forward or
filter into your personal inbox from there if you want them on your phone.

## Instant alerts

One alert email per event, sent the moment it happens:

| Event | Trigger point |
|---|---|
| New business signs up | New account created |
| Subscription started / upgraded | Subscription becomes active |
| Subscription cancelled | Cancellation confirmed |
| Booking deposit or full payment taken | Payment captured on an accepted booking |
| Booking refunded | Refund issued |
| Payout account connected | Business finishes Stripe onboarding |
| Contact form message | Already sent — will be folded into the same format |

Each email shows: event type, business name, plan tier, client name where relevant, amount
charged, BookSuite's platform fee, and a timestamp.

## Daily summary

One email at 21:00 UK time each day covering the previous 24 hours:

- New signups, with business names
- Subscriptions started and cancelled, with net change
- Total bookings taken across all businesses
- Gross payment volume and total BookSuite platform fees earned
- Refunds issued
- Any failed charges or failed emails worth looking at
- Quiet days still send, marked "no activity", so silence never looks like a broken system

## Technical notes

- New email templates `platform-alert` and `platform-daily-summary` in the existing
  transactional template registry, styled to match the current BookSuite emails.
- New shared helper `_shared/notify-admin.ts` that reads `ADMIN_ALERT_EMAIL` and fires a
  `platform-alert` send. It never throws into the caller, so an alert failure can never
  break a signup, payment, or booking.
- Helper calls added to: `charge-booking-deposit`, `refund-booking-deposit`,
  `check-subscription`, `cancel-subscription`, `stripe-connect-webhook`, and `submit-contact`.
- Signups: a database trigger on new profile rows calls a small `notify-admin-signup`
  function, so it fires no matter how the account was created.
- Daily summary: new `send-daily-summary` edge function that aggregates from `bookings`,
  `subscriptions`, `profiles` and `email_send_log`, scheduled with pg_cron at 21:00 UK and
  guarded by the existing cron authorization check.
- Alerts use idempotency keys derived from the source record id, so retries never double-send.
- All sends go through the existing queue and appear in Cloud → Emails like every other email.

## Volume note

Instant alerts scale with the whole platform, so at high volume this inbox will get busy.
Once that happens the easy dial is to keep instant alerts for signups, subscriptions and
refunds only, and let bookings roll up into the daily summary. Nothing in this build blocks
that change.
