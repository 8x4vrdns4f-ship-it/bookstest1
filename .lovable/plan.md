## Waitlist for full slots

Let customers join a waitlist when their preferred date/time is fully booked, and automatically notify them if a slot opens up (cancellation or decline).

### User flow

**Customer (booking widget)**
1. Picks a date on the widget. If no times are available (or their preferred time is taken), a new "Join the waitlist" option appears.
2. Fills in name, email, phone, party size, preferred date, and (optional) preferred time window.
3. Gets a confirmation email: "You're on the waitlist — we'll email you if a slot opens."

**Owner (dashboard)**
1. New **Waitlist** tab under the Bookings page shows all active waitlist entries grouped by date.
2. Owner can manually convert an entry into a booking, or remove it.
3. When a booking is cancelled/declined, matching waitlist entries for that date are auto-notified by email with a one-click link back to the widget (pre-filled).

### Steps

1. **Database migration**
   - New table `waitlist_entries` (id, user_id, client_name, client_email, client_phone, preferred_date, preferred_time_start, preferred_time_end, party_size, service, notes, status [`active`/`notified`/`converted`/`cancelled`/`expired`], notified_at, created_at, updated_at).
   - Grants + RLS: owners can read/write their rows; anon can INSERT (widget) via a `SECURITY DEFINER` RPC only (no direct public SELECT).
   - New setting on `business_settings`: `waitlist_enabled boolean` (default true).

2. **Public RPC**
   - `join_waitlist(p_user_id, name, email, phone, date, time_start, time_end, party_size, service, notes)` — validates, inserts, returns the entry id.
   - `get_waitlist_settings(p_user_id)` extended into existing `get_widget_settings` return so the widget knows whether waitlist is on.

3. **Auto-notify on slot open**
   - New edge function `notify-waitlist` invoked when a booking transitions to `cancelled` or `declined` (from `decline-pending-booking`, `cancel-booking-client`, and owner-side cancels).
   - Finds `active` waitlist entries for the same `user_id` + `preferred_date` whose time window overlaps the freed slot, marks the first N as `notified`, and enqueues a "Slot available" transactional email.

4. **Transactional emails**
   - `waitlist-joined.tsx` — confirmation to customer.
   - `waitlist-slot-available.tsx` — includes deep-link back to widget with `?date=&time=` prefilled.
   - Register both in `registry.ts`.

5. **Widget UI (`PublicBooking.tsx`)**
   - When the selected date has zero remaining slots (or user opts in), show a "Join the waitlist" CTA.
   - New `WaitlistDialog` component with the form; on submit calls the RPC and shows a success state.
   - Respect `notify_client_review_request`-style toggle: skip UI when `waitlist_enabled = false`.

6. **Owner dashboard**
   - New `src/components/dashboard/WaitlistCard.tsx` listing entries grouped by date, with actions: "Convert to booking" (opens existing booking dialog prefilled) and "Remove".
   - Add a **Waitlist** tab to `src/pages/dashboard/BookingsPage.tsx`.
   - Add a toggle in `Settings.tsx` under Notifications: "Waitlist enabled".

7. **Cleanup**
   - Daily cron marks entries `expired` once their `preferred_date` has passed.

### Technical notes

- All new tables get explicit `GRANT`s + RLS (`authenticated` owners only; anon writes go through the RPC).
- The notify function is triggered from existing cancel/decline edge functions — no DB triggers hitting `net.http_post`.
- No changes to Stripe/payment flow; waitlist entries never charge.
- Emails go through the existing `send-transactional-email` pipeline and respect suppression list.
- Files touched: 1 migration, 1 new RPC pair, 1 new edge function, 2 new email templates + registry, `PublicBooking.tsx`, new `WaitlistDialog.tsx`, new `WaitlistCard.tsx`, `BookingsPage.tsx`, `Settings.tsx`, `cancel-booking-client`, `decline-pending-booking`, owner-side cancel path.
