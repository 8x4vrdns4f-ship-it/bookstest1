## Goal

Let each business owner choose how long a pending booking request stays open before it auto-expires, instead of the hardcoded 48 hours.

## Changes

### 1. Database
Add a new column to `business_settings`:
- `pending_request_ttl_hours integer NOT NULL DEFAULT 48`

Update `validate_business_settings()` trigger to enforce a sensible range (min 1, max 168 = 7 days).

### 2. Expire edge function (`expire-pending-bookings`)
Instead of a single global 48h cutoff, join each pending row against its owner's `pending_request_ttl_hours`:

```text
select pb.*, coalesce(bs.pending_request_ttl_hours, 48) as ttl_hours
from pending_bookings pb
left join business_settings bs on bs.user_id = pb.user_id
where pb.status = 'awaiting_owner'
  and pb.created_at < now() - make_interval(hours => coalesce(bs.pending_request_ttl_hours, 48))
```

Simplest path: expose this via a new `SECURITY DEFINER` RPC `get_expired_pending_bookings(limit int)` the function calls, or do the filter in a raw supabase query. RPC keeps the function lean.

Cron cadence stays every 15 min.

### 3. Owner UI — `BusinessSettingsDialog`
Add a "Pending request expiry" number input (hours, 1–168) alongside the existing deposit / hours fields. Help text: "How long a booking request stays open before it's auto-declined and the card released."

### 4. Dashboard — `BookingRequestsCard`
Read the owner's `pending_request_ttl_hours` once on mount (already fetches settings elsewhere — or add a small query) and use it in the "Expires in Xh" calculation instead of the hardcoded 48.

## Out of scope
- Per-service TTL.
- Warning email to owner at 50% of TTL (separate feature).
