# Permanent weekly schedules for employees

## What the owner gets

**Set a weekly schedule once**
- Pick the days someone works (e.g. Mon–Thu) and one set of hours (e.g. 9:00–17:00) that covers all of those days.
- Choose when it starts: **from today** or **from a date you pick** (e.g. a new contract on 1 November).
- The app fills in their shifts automatically, week after week. Nobody has to plan shifts by hand anymore.

**Change a single day**
- Click any shift for one employee and change its times, or mark them off that day.
- A tick box, **"Apply to all their days"**, turns that change into their new weekly hours instead of a one-off.
- One-off changes stay as they are when the weekly schedule is filled in again.

**Two places to do it**
- **Shifts page:** a new "Weekly schedules" grid with every employee and Mon–Sun, their hours, and an Edit button on each row.
- **Employee profile:** a "Weekly schedule" section with the same controls for that person.

**Works with holidays:** holiday days are counted from these shifts, so a Mon–Thu schedule is never charged for a Friday.

## Technical details

- New table `employee_schedules` (user_id, employee_id, weekdays int[] 0–6, start_time, end_time, effective_from date, active). One active schedule per employee; saving a new one closes the old one at the new start date. GRANTs + RLS: the owner, or anyone with the manage-settings permission, can manage; the employee can read their own.
- `employee_shifts` gets `is_override boolean default false`. Manual edits set it to true.
- SECURITY DEFINER function `apply_employee_schedule(_employee_id, _from, _weeks default 12)`: deletes future non-override shifts from `_from` onwards and inserts shifts for matching weekdays; skips dates that already have an override. It is called on save, and a daily cron job extends every active schedule so there are always about 12 weeks ahead.
- Dialog "Apply to all their days": updates the schedule's start/end time, then re-applies from today.
- UI: new `WeeklyScheduleEditor` (day chips, time inputs, start option) used in a new `WeeklySchedulesCard` on ShiftsView and inside EmployeeProfileDialog. The shift edit in ShiftsView/ManageShiftsDialog sets `is_override` and shows the tick box.
- Existing shifts are left alone; schedules only replace future auto-generated shifts.
