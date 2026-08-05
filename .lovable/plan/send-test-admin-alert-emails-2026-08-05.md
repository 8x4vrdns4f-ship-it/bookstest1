# Send test admin alert emails

Fire one sample of each instant alert to help@booksuite.online so you can judge how they look in the inbox. The daily summary is excluded — it lands at 21:00 UK on its own.

## What gets sent

Five emails, all using the real `platform-alert` template with realistic sample data:

1. New signup — business name, email, category, company code
2. Subscription started — account, plan, renewal date
3. Subscription cancelled — account, plan
4. Booking paid — client, service, appointment time, amount charged, platform fee
5. Booking refunded — client, service, refund amount
6. Payout account ready — country, currency

## How

Call the existing `send-transactional-email` function directly for each alert, with test-prefixed idempotency keys (e.g. `admin-test-signup-<timestamp>`) so nothing collides with real event keys. No app or database changes; nothing is written to bookings, subscriptions, or profiles.

Each email's subject/body will be clearly the same as production, so what you see in the inbox is exactly what real events will look like. After sending I'll check the send log to confirm all six were accepted, then report back.

## Then

If they look off, the next round of work is design polish on the alert template — spacing, header/branding, subject lines, and how the detail rows are laid out.
