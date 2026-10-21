# Clearer shifts setup, easy staff assigning, and automatic assigning

## 1. Make the Shifts page explain itself
- New page description: "Set each person's usual week once: pick the days they normally work and their hours, then press Save. That becomes their regular schedule and keeps repeating, with no end date. You can change it any time, or click a single day to make a one-off change."
- A 3-step strip at the top of the page: **1. Set usual week** -> **2. It repeats every week** -> **3. Click any day to change just that day**.
- In the "Set usual week" window: change the button to "Save as their usual week" and add a line under it: "This repeats every week until you change it."
- Each person's row shows "Repeats weekly from 21 Oct" so it's obvious the schedule is ongoing.

## 2. Assign staff to any booking easily
- An **Assign** dropdown on every booking in the Bookings list and the Calendar, so there's no need to open the booking first. It shows "Unassigned" in amber so gaps are easy to spot.
- The dropdown lists who is **working at that time** first and labels anyone off or on holiday ("Off today", "On holiday").
- An **Unassigned** filter on the Bookings list.
- The person you pick sees the booking on their Today/Schedule straight away (this already works once a booking is assigned).

## 3. Automatic assigning (new setting)
New "Automatic staff assigning" card in Settings with three choices:
- **Off**: assign by hand (as now).
- **By chair / room**: link each bookable resource (e.g. "Chair 1") to a staff member. When that chair is booked, the booking goes to that person automatically.
- **By service**: link services to the staff who do them; the booking goes to whoever offers that service and is working at that time, picking the person with fewest bookings that day.

Rules:
- Auto-assign only picks someone who is on shift at that time and not on holiday. If nobody fits, the booking stays Unassigned and the owner gets the usual new-booking notice with "needs a staff member".
- The owner can always change who it's assigned to afterwards.
- Works for widget bookings, bookings added by hand, and the AI assistant.

## Technical details
- DB: `resources.default_employee_id uuid` (nullable, FK employees, ON DELETE SET NULL); new table `service_employees(user_id, service_id, employee_id)` with GRANTs + RLS (owner / manage-settings permission; employee read own); `business_settings.auto_assign_mode text default 'off'` ('off'|'resource'|'service') validated in `validate_business_settings`.
- BEFORE INSERT trigger on `bookings` (security definer) fills `assigned_employee_id` when null using the mode, checking `employee_shifts` covering the time and approved `time_off_requests`. Existing `notify_employee_booking_change` then notifies the employee. Covers every booking path in one place.
- UI: shared `AssignEmployeeSelect` (fetches shifts/time off for the booking date) used in BookingsList, CalendarView, BookingDetailDialog, ReceptionistView. Settings card `AutoAssignCard` plus a staff picker per row in ResourcesManager and ServicesManager.
- Copy changes in ShiftsPage, ShiftsView and the usual-week editor. Record the trigger rule in AGENTS.md.
