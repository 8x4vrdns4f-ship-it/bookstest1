# Employee side, round 2

The Today / Schedule / Profile app works. This pass makes it feel alive and closes the loop back to the manager.

## 1. Live updates instead of manual refresh

The employee view only updates when they hit the refresh button. Subscribe to their own bookings so a new assignment, a time change, or a cancellation appears immediately, with a small toast ("New appointment added — 14:30, Sam").

## 2. Time-off / unavailability requests

Employees can request a day (or a date range) off with an optional reason. It shows as "Requested" on their Schedule tab and lands in the manager's Staff area for Approve / Decline. Approved days mark them unavailable so the roster and assignment stop offering them.

## 3. Notification bell + history

A small bell in the employee header listing recent events: new assignment, booking cancelled, shift changed, time-off decision. Unread count, tap to jump to the booking.

## 4. Manager visibility of employee actions

The Staff tab shows, per employee: available now, on shift, current job in progress, completed today, and any pending time-off request. So the manager sees the employee's own updates rather than guessing.

## 5. Employee stats worth caring about

On Profile: appointments completed this week, hours worked this week, average review rating for jobs they handled (reviews already store the booking, so this is derivable).

## 6. Smaller polish

- Pull-to-refresh on mobile in addition to the button.
- "Running late" quick action on an in-progress booking that stamps a note the manager can see.
- Schedule tab: show past 7 days as well as the next 14, so they can check what they worked.

## Technical notes

- New table `time_off_requests` (employee_id, user_id, start_date, end_date, reason, status, decided_by, decided_at) with grants, RLS so an employee reads/creates their own rows and the owner/manager reads and decides all rows for their business.
- New table `employee_notifications` (employee_id, user_id, type, title, body, booking_id, read_at) written by triggers on `bookings` (assignment change, status change, cancel) and on time-off decisions; RLS scoped to the linked employee plus the owner.
- Realtime: enable replica identity + publication for `bookings` and `employee_notifications`; subscribe in `EmployeeDashboard.tsx`.
- New components: `TimeOffCard.tsx`, `EmployeeNotifications.tsx` under `src/components/employee/`, and a `TimeOffRequestsCard.tsx` in the manager's Staff page.
- Rating and hours stats computed client-side from `reviews`, `bookings`, and `employee_shifts` — no new aggregate tables.

## Out of scope

Shift swapping between employees, payroll/earnings, in-app chat, push notifications to the phone OS.
