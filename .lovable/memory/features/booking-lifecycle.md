---
name: booking-lifecycle
description: Pending → Accept/Decline flow with 6-char confirmation codes
type: feature
---
Bookings created by widget are `status='pending'`.
Dashboard shows Accept (green) + Decline (red) buttons only for pending rows.

**Accept:** calls `generate_booking_code()` RPC → sets `status='confirmed'` + `confirmation_code` (6-char from ABCDEFGHJKLMNPQRSTUVWXYZ23456789 alphabet, unique per row). Code shown as font-mono badge in bookings list. Client shows this code at the venue.

**Decline:** sets `status='cancelled'` + `decline_reason`.

Already-handled bookings show normal status dropdown instead.

`get_busy_slots(p_user_id, p_from, p_to)` RPC (SECURITY DEFINER, anon executable) returns date/time/duration/status of pending+confirmed bookings — used by the widget to grey out booked slots without exposing client info.

Email sending is stubbed (no domain configured). Wire `supabase.functions.invoke('send-transactional-email', ...)` inside `handleAccept` / `handleDecline` in `BookingsList.tsx` once domain + scaffold are done. Templates needed: `booking-confirmed` (with code), `booking-declined`.
