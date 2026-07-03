## Goal

Automatically decline any pending booking request that hasn't been accepted or declined within 48 hours: detach the saved card in Stripe, clear the pending row, and email the customer so they aren't left waiting on a card that will never be charged.

## How it works

```text
Customer requests booking
        │
        ▼
pending_bookings row created
status = 'awaiting_owner'
created_at = now()
        │
        ├── Owner accepts within 48h ─► charge-booking-deposit (existing)
        ├── Owner declines within 48h ─► decline-pending-booking (existing)
        └── No action after 48h
                │
                ▼
        pg_cron runs every 15 min
                │
                ▼
        expire-pending-bookings edge function
                │
                ├── Finds rows where status='awaiting_owner' AND created_at < now() - 48h
                ├── For each: stripe.paymentMethods.detach(...)
                ├── Marks pending row status='expired' (kept for audit)
                └── Enqueues "your request expired" email to customer
```

## Changes

### 1. New edge function `expire-pending-bookings`
- Service-role, no JWT required (called by cron).
- Selects up to 100 `pending_bookings` where `status = 'awaiting_owner'` and `created_at < now() - interval '48 hours'`.
- For each row: detaches `stripe_payment_method_id` (best-effort — swallow "already detached" errors), sets `status = 'expired'` and `expired_at = now()`, and enqueues a "booking-request-expired" transactional email to the client.
- Also emails the business owner a short "a pending request expired" note so they know.
- Returns `{ expired: <count> }`.

### 2. New email template `booking-request-expired.tsx`
Under `supabase/functions/_shared/transactional-email-templates/`, registered in `registry.ts`. Message: "Your booking request with {business} wasn't confirmed in time. No charge was made. Feel free to request again."

### 3. Database migration
- Add `pending_bookings.expired_at timestamptz null`.
- Extend the allowed `status` values (via check constraint or comment) to include `'expired'`.
- Add partial index `on pending_bookings (created_at) where status = 'awaiting_owner'` so the cron scan stays cheap.

### 4. Schedule via pg_cron (using `supabase--insert`, not migration — it holds the project ref + anon key)
```sql
select cron.schedule(
  'expire-pending-bookings',
  '*/15 * * * *',
  $$ select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/expire-pending-bookings',
       headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
```
Ensures `pg_cron` and `pg_net` extensions are enabled first.

### 5. Dashboard `BookingRequestsCard`
- Show a small "expires in Xh" hint on each pending request so owners see the deadline.
- Filter out `status = 'expired'` rows from the queue (they're kept for audit only).

## Notes / risks

- **Idempotency**: the function uses `status='awaiting_owner'` as the filter, so a repeat run won't double-process.
- **Race with accept**: if the owner clicks Accept exactly as the cron runs, one will win on the `status` update — the other will see the row already advanced and no-op.
- **Stripe detach failure**: logged but non-fatal; the pending row is still marked expired to prevent stuck queue entries.
- **48h window**: hardcoded for now. Could later be moved to `business_settings.pending_request_ttl_hours` if owners ask for it.

## Out of scope

- Configurable per-business TTL.
- Reminder email at 24h ("still waiting on the business"). Can be added later.
