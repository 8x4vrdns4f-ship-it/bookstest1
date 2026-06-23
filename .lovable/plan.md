# Per-person Shifts editor

Rework the **Shifts** tab so the owner picks an employee, then edits each day individually across a date range — toggling days on/off and setting unique start/end times per day. Default range is 1 week; the owner can extend it.

## UX

- Top bar of the Shifts tab:
  - **Employee selector** (dropdown of all staff).
  - **Range selector**: 1 week (default), 2 weeks, 4 weeks, or Custom (from/to date pickers).
  - **Prev / Next** arrows that jump the window by its current length.
  - Existing **Plan Schedule** and **Add Employee** buttons stay.
- Body: one row per day in the range for the selected employee.
  - Checkbox: working that day (on/off).
  - Two time inputs: start and end (disabled when off).
  - Shows the weekday + date on the left.
- Footer: single **Save shifts for {Employee Name}** button that writes only the changed rows.
- Empty state when no employees: same "Add your first team member" card as today.

## Behavior

- Switching employee or range reloads that employee's shifts for the visible dates.
- Times default to 09:00–17:00 for newly-toggled days.
- Save logic per row:
  - Was off, now on → insert into `employee_shifts`.
  - Was on, still on, times changed → update.
  - Was on, now off → delete.
  - Unchanged rows are skipped.
- Toast on save, then reload.

## Technical notes

- Replace `src/components/dashboard/ShiftsView.tsx` content; reuse existing `employee_shifts` table (`user_id`, `employee_id`, `shift_date`, `start_time`, `end_time`) — no schema changes.
- Keep `PlanShiftsDialog` and `AddEmployeeDialog` integrations intact.
- The date-first `ManageShiftsDialog` stays available where it's already used elsewhere; no changes there.
- Use a simple `Select` from `@/components/ui/select` for employee + range pickers, and `Input type="date"` for custom range.
- Range generation done in-component with `date-fns` (already in deps) — `eachDayOfInterval`.
