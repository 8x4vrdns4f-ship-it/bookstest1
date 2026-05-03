---
name: Staff Day View
description: Staff tab shows who's working today in 3 columns (In Progress / Free / Unavailable) with shifts and per-employee actions
type: feature
---
The Staff tab on the owner dashboard:
- Filters by date (defaults to today). Only employees with a row in `employee_shifts` for that date appear.
- Owner manages shifts via "Manage Shifts" dialog (per-day on/off + start/end time, unique per employee+date).
- Status logic per employee:
  - `in_progress` if a booking assigned to them is currently happening (today only, status in pending/confirmed/in_progress, now between start and start+duration).
  - else manual override from `employees.manual_status` (if `manual_status_date` matches the viewed date).
  - else `free`.
- Clicking a card opens EmployeeActionsDialog: contact links, set Free/Unavailable (or clear), see today's assigned bookings (with unassign), assign from today's unassigned pending/confirmed bookings.
- Auto-refresh of "in progress" via 60s tick.
