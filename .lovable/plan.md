## Goal

Keep expired pending booking requests visible in the dashboard so owners can see what they missed, rather than having them silently disappear from the queue.

## Changes

### 1. `BookingRequestsCard.tsx`
- Extend the loaded rows to also fetch `status = 'expired'` (last 30 days, capped at ~20).
- Split the render into two lists:
  - **Active queue** (top) — same as today: `awaiting_owner`, `charging`, `charge_failed`. Accept/Decline buttons and "Expires in Xh".
  - **Recently expired** (below) — collapsed by default inside a small "Show N expired requests" toggle (native `<details>` or a simple `useState` boolean). Rows are read-only:
    - Muted styling (opacity 60, no action buttons).
    - Badge "Expired" (destructive/outline variant).
    - Show client name, service, requested date/time, and "Expired {relative time} ago".
- Empty-state copy stays the same when both lists are empty.

### 2. No backend changes
- `expire-pending-bookings` already sets `status='expired'` and `expired_at`.
- RLS on `pending_bookings` already lets the owner read their own rows regardless of status.
- Cron/edge function untouched.

## Out of scope
- A "Dismiss" button to permanently hide an expired row.
- Filtering expired rows by date range or exporting them.
- Surfacing expired requests anywhere else (bookings list, analytics).
