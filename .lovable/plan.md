## Goal

Deliver three client-facing features that reduce no-shows, cut admin workload, and build social proof:

1. **Client booking reminders** — automated email 24 hours before a confirmed appointment.
2. **Client self-service portal** — secure link in confirmation emails lets clients reschedule or cancel within the business's cancellation window.
3. **Reviews & ratings** — after a confirmed appointment passes, email the client a one-click star rating; aggregate rating displays on the public booking page.

---

## 1. Client booking reminders

### Database changes
- Add `client_reminder_sent_at timestamptz` to `public.bookings` (nullable, default null).

### Email template
- New template `booking-reminder-client.tsx` registered in `registry.ts`.
- Content: appointment details (business name, service, date, time, location) plus a CTA to the self-service portal.

### Edge function
- New edge function `send-booking-reminders`:
  - Query `bookings` where `status = 'confirmed'`, `booking_date` is tomorrow, and `client_reminder_sent_at IS NULL`.
  - For each match, invoke `send-transactional-email` with idempotency key `booking-remind-${id}`.
  - Update `client_reminder_sent_at = now()`.
  - Returns `{ ok: true, reminded: N }`.

### Cron schedule
- Hourly `pg_cron` job calling `send-booking-reminders`.

### Settings toggle
- Add `notify_client_reminder boolean` to `business_settings` (already partially present; wire it up in the Settings UI).
- Only send reminders when this toggle is true.

---

## 2. Client self-service portal

### Secure tokens
- Add `client_access_token uuid` to `public.bookings` (nullable, default `gen_random_uuid()`).
- Add `client_token_expires_at timestamptz` (default to booking end time + 7 days).

### New page
- Route `/booking/manage/:token` (page `ManageBooking.tsx`):
  - Validates token by looking up `bookings` where `client_access_token` matches and `client_token_expires_at > now()`.
  - Shows appointment details and two actions: **Reschedule** and **Cancel**.
  - **Reschedule**: open a mini widget/calendar view limited to the same service and business; pre-fill client details. On submit, update the existing booking row (new date/time) and send a confirmation email.
  - **Cancel**: confirm dialog, then set `status = 'cancelled_by_client'`, trigger deposit refund if within policy, and send cancellation confirmation.

### Email wiring
- Update `booking-confirmed` template to include a "Manage your booking" button with the self-service URL.

---

## 3. Reviews & ratings

### Database changes
- New table `public.reviews`:
  - `booking_id uuid` (unique, references bookings)
  - `user_id uuid` (business owner)
  - `rating integer` (1–5)
  - `comment text` (nullable)
  - `created_at timestamptz`
- Grant `authenticated` SELECT/INSERT, `service_role` ALL.
- Enable RLS; policy: reviewers can insert via a secure token path; owners can read their own reviews.

### Review token
- Add `review_token uuid` to `public.bookings` (default `gen_random_uuid()`, nullable).
- Add `review_sent_at timestamptz` and `review_submitted_at timestamptz`.

### Post-appointment review flow
- New edge function `send-review-requests`:
  - Runs daily/hourly via cron.
  - Finds confirmed bookings where `booking_date + duration` is in the past, `review_sent_at IS NULL`, and `review_submitted_at IS NULL`.
  - Sends `review-request-client` email with a one-click link to `/review/:token`.
  - Updates `review_sent_at`.

### Review page
- New route `/review/:token` (page `SubmitReview.tsx`):
  - Validates `review_token`.
  - Star rating input (1–5) and optional comment textarea.
  - On submit, insert into `reviews`, update `booking.review_submitted_at`, show thank-you.

### Public display
- Update `get_public_business_info` or create a new RPC to return `average_rating` and `review_count` for a business.
- Display average stars and count on `PublicBooking.tsx` below the business name.

---

## Out of scope
- SMS reminders (email only for now).
- Marketing/re-engagement emails.
- Photo attachments on reviews.
- Owner reply to reviews.
- Waitlist (explicitly excluded by user).

## Technical notes
- All email sends go through existing `send-transactional-email` infrastructure with idempotency keys.
- Self-service and review tokens are opaque UUIDs; no auth required from the client.
- Reschedule logic reuses existing widget slot logic where possible (RPCs `get_busy_slots`, `get_widget_settings`, etc.).
- Database migration uses standard GRANT + RLS pattern for any new tables.