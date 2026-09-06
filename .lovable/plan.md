# Customer bookings portal

A place where the people who book with your businesses can see everything they've booked, in one list, without creating an account or remembering a password.

## How they get in

1. They go to `/my-bookings` and type the email address they booked with.
2. They receive an email with a secure sign-in link (valid 30 minutes, single use).
3. Clicking it opens their portal, and it stays open on that device for 30 days.

The same message is shown whether or not the email exists, so nobody can use the form to find out who has booked. The request form is rate limited (5 attempts per email and per address per hour).

We also add a "See all my bookings" link to the existing single-booking page and to booking confirmation emails, so people discover the portal naturally.

## What they can do

- **Upcoming and past bookings** in one list, grouped by date, across every business they've booked with — with service, date/time, business name, address, phone, status, deposit/amount paid and confirmation code.
- **Cancel** a booking, respecting each business's cancellation notice window; blocked with a clear explanation when it's too late. Uses the existing cancellation flow so the business gets notified as today.
- **Reschedule** — pick a new date and free slot from that business's real availability (same working hours, buffers, closures and staff/resource rules the public booking page uses). The business gets notified; the deposit carries over.
- **Book again** — one tap opens that business's booking page pre-filled with the same service and their details.
- **Add to calendar** — download an .ics file, plus Google Calendar link.
- **Get directions** — map link from the business address.
- **Leave a review** for completed bookings that haven't been reviewed yet (reuses the existing review flow).
- **Their details** — update name and phone, so future bookings prefill correctly.
- **Email preferences** — unsubscribe from reminders/marketing (uses existing unsubscribe handling).
- **Sign out** of the portal.

The portal is mobile-first, matches the BookSuite dark theme, and is excluded from search engines.

## Technical detail

**Database** (one migration)
- New `client_portal_sessions` table: `id`, `email` (lowercased), `token_hash`, `expires_at`, `used_at`, `session_token_hash`, `session_expires_at`, `created_at`, `ip`. RLS enabled with no public policies; only edge functions (service role) touch it. Grants: `service_role` only.
- New security-definer RPCs are not needed — all portal reads go through edge functions using the service role, keyed by a verified session.

**Edge functions** (new)
- `client-portal-request-link` — validates email, rate-limits via existing `check_rate_limit`, creates a hashed one-time token, enqueues the sign-in email. Always returns success.
- `client-portal-verify` — exchanges the one-time token for a 30-day session token (hashed at rest), returned to the browser and stored in `localStorage`.
- `client-portal-bookings` — returns all bookings (plus business info, review state, cancellation window) for the session's email.
- `client-portal-update-booking` — handles cancel and reschedule; re-validates availability server-side against working hours, date overrides, buffers, existing bookings, resources and staff, and reuses the existing cancel/notify paths.
- `client-portal-update-client` — name/phone updates on the matching `clients` rows.

All of these validate the session token first and never trust an email sent from the browser.

**Email**
- New template `client-portal-link.tsx` registered in the existing transactional registry, styled to match current templates; sent through `send-transactional-email`.

**Frontend**
- `src/pages/MyBookings.tsx` (email entry + portal), `src/pages/MyBookingsVerify.tsx` (link landing), and components under `src/components/portal/` for the booking card, reschedule dialog, cancel dialog and details form.
- `src/lib/clientPortal.ts` for session storage and function calls; `src/lib/ics.ts` for calendar files.
- Routes `/my-bookings` and `/my-bookings/verify` in `src/App.tsx`, public, `noIndex`, outside the owner/employee routing so nothing changes for business logins.
- Availability picker reuses the existing public-booking slot logic rather than duplicating it.

**Not included**: taking new payments or refunds inside the portal (cancellations follow the existing refund rules), and multi-language beyond what the app already supports.
