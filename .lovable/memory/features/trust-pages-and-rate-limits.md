---
name: Public trust pages and abuse protection
description: About/Contact/Cookies pages, cookie consent banner, contact form pipeline, and edge-function rate limiting
type: feature
---

## Public pages
- `/about` — story, values, and a "[TO BE ADDED]" company-details block (registered name, address, company number, ICO) to fill in once the company is registered.
- `/contact` — validated form (name, email, subject, message 10–2000 chars) plus a hidden honeypot field. Posts to the `submit-contact` edge function.
- `/cookies` — cookie table + how to change consent.
- `CookieBanner` shows on first visit, stores `booksuite:cookie-consent` in localStorage ("accepted" | "rejected").
- Support address everywhere: help@booksuite.online.

## Contact pipeline
`submit-contact` validates, rate limits, inserts into `contact_messages`, then sends two emails:
`contact-received-owner` (to help@booksuite.online) and `contact-confirmation` (to the sender).

## Rate limiting
`supabase/functions/_shared/rate-limit.ts` wraps the `check_rate_limit` DB function
(service-role only). Fails open on infrastructure errors so real bookings are never blocked.
Rules: contact 5/hr, booking 10/15min, waitlist 8/hr, review 10/hr — checked by IP and email.
Applied to: submit-contact, save-pending-booking, create-booking-intent,
create-booking-checkout, submit-review, and inside the `join_waitlist` DB function.
`embed-assistant` keeps its own per-tier quota instead.
