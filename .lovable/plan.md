## Goal

Notify business owners when pending widget booking requests expire, and nudge them with a reminder partway through the TTL so fewer requests slip through the cracks.

---

## 1. Owner expiry notification

When `expire-pending-bookings` marks a request as `expired`, also email the owner (today only the customer is notified).

### Changes

- **New email template** `supabase/functions/_shared/transactional-email-templates/booking-request-expired-owner.tsx`
  - Same brand style as existing templates (`#ffffff` body, dark headings, light card).
  - Content: "A booking request expired", client name, service, date/time, and a note that the card was not charged.
- **Register template** in `registry.ts` under the key `booking-request-expired-owner`.
- **Update `expire-pending-bookings`** edge function:
  - After successfully updating the row to `status='expired'` and emailing the client, call `admin.rpc('get_owner_email', { _user_id: pending.user_id })` to get the owner's address.
  - Invoke `send-transactional-email` with the new owner template and an idempotency key like `pending-expired-owner-${pending.id}`.

---

## 2. Reminder nudge before expiry

Send owners a single reminder when a request is about halfway through its configured TTL and still unanswered.

### Changes

- **Database migration**
  - Add `reminder_sent_at timestamptz` to `public.pending_bookings` (nullable, default null).
  - Update the existing `pending_bookings` RLS policies if needed so the owner can still read/write their own rows.

- **New email template** `supabase/functions/_shared/transactional-email-templates/booking-request-reminder-owner.tsx`
  - Content: "You have a pending booking request about to expire", client details, requested slot, deposit amount, and a CTA to open the dashboard.
- **Register template** in `registry.ts` under the key `booking-request-reminder-owner`.

- **New edge function** `supabase/functions/remind-pending-bookings/index.ts`
  - Uses the admin/service-role Supabase client.
  - Query `pending_bookings` where `status = 'awaiting_owner'` and `reminder_sent_at IS NULL`.
  - Fetch each owner's `pending_request_ttl_hours` from `business_settings` (fallback 48h).
  - Select rows where `now() - created_at >= (ttl_hours / 2) * 3600 * 1000` (i.e. at least 50% through the TTL).
  - For each due row:
    1. Look up owner email via `get_owner_email` RPC.
    2. Invoke `send-transactional-email` with the reminder template and idempotency key `pending-remind-owner-${pending.id}`.
    3. Update the row's `reminder_sent_at` to prevent duplicate sends.
  - Returns JSON `{ ok: true, reminded: N }`.

- **Cron schedule** (SQL executed via `supabase--insert`):
  - Hourly `pg_cron` job calling `remind-pending-bookings` via `net.http_post` with the `apikey` header.

---

## Technical notes

- Both email sends go through the existing `send-transactional-email` queue infrastructure (`notify.booksuite.online` domain is already verified).
- The `send-transactional-email` ownership guard allows `service_role` callers, so edge functions invoking it with the service-role client will succeed.
- The `get_owner_email` RPC already exists and queries `auth.users` securely.

---

## Out of scope

- Configurable reminder threshold per business (fixed at 50% of TTL for now).
- Digest/summary emails (one email per request).
- In-app notification bell or push notifications.
- SMS reminders.