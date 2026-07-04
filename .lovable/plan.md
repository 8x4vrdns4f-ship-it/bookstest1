## Wrap-up plan for reminders, self-service & reviews

Three small pieces remain from the last batch. All backend; the client-facing UI change is a rating badge on the public booking page.

### 1. Schedule the automated jobs (pg_cron)
- Hourly job → `send-booking-reminders` (fires client 24h-before reminders).
- Daily job (e.g. 09:00 UTC) → `send-review-requests` (asks for a rating after the appointment ends).
- Uses `net.http_post` with the project's anon key, following the standard Lovable cron pattern.

### 2. Aggregate rating RPC
- Update (or add a companion to) `get_public_business_info` so it returns `average_rating numeric` and `review_count integer` computed from `public.reviews` for that `user_id`.
- Security definer, stable, only exposes aggregates — no individual reviewer data.

### 3. Public booking page rating display
- Extend the `PublicInfo` type in `src/pages/PublicBooking.tsx` with the two new fields.
- Under the business name (inside `PublicBookingHeader` or just below it), render a small rating row: ★ average (1 decimal) · "N reviews", only when `review_count > 0`.
- No other layout changes.

### Out of scope
- Owner-facing reviews dashboard (can be a follow-up).
- Editing/deleting reviews.
- Displaying individual review text on the public page.
