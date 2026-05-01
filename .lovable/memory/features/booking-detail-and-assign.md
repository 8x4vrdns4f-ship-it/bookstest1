---
name: booking-detail-and-assign
description: Click bookings in either Bookings tab or Calendar to open shared detail dialog with employee assignment
type: feature
---
Shared `BookingDetailDialog` component opens from both Bookings list and CalendarView day-schedule. Lets owner:
- Reassign to any employee (or unassign) via Select; updates `bookings.assigned_employee_id`
- Change status (pending/confirmed/in_progress/completed/cancelled)
- View full client details + confirmation code

Status `in_progress` is now an option in both the inline Select and the dialog.

Bookings tab has a search bar that filters by code, name, or email (case-insensitive).

Realtime subscription on `bookings` table refreshes BookingsList, CalendarView, and DashboardCharts on insert/update/delete — no refresh needed.

EmployeeDashboard filters `bookings` by `assigned_employee_id = employee.id` so staff only see their own assigned work.
