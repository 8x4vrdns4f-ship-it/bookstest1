---
name: Employee Live Updates & Time Off
description: Realtime employee dashboard, in-app notification bell, staff time-off requests with manager approval
type: feature
---
- `employee_notifications` rows are created by DB triggers on `bookings` (assigned, unassigned, rescheduled, cancelled/declined) and on time-off decisions. Employee reads/marks own; owner can read.
- `time_off_requests` (employee_id, user_id, start_date, end_date, reason, status, decision_note). Employee creates/cancels own pending; anyone with `approve_requests` permission approves/declines with an optional note.
- Realtime enabled on `bookings`, `employee_notifications`, `time_off_requests`; EmployeeDashboard subscribes and reloads + toasts.
- Employee Profile tab shows weekly stats (completed, hours from shifts, average review rating for their bookings) and the time-off card.
- Schedule tab shows next 14 days plus last 7 days, with time-off badges.
- "I'm running late" appends a timestamped note to the booking so the manager sees it.
- Manager sees pending/decided requests in `TimeOffRequestsCard` on /dashboard/staff.
