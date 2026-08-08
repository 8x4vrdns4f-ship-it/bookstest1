# Staff tab: add a full team roster list

## Current behaviour

The Staff tab does **not** show all employees. It shows a day-based duty view:

- Everything is filtered to the selected date's shifts. Only employees with a shift on that date appear in "On shift now" and the In Progress / Free / Unavailable columns.
- If nobody has a shift that day, the page shows a "No shifts scheduled" empty state — even when you have 10 staff on file.
- So a newly added employee with no shift yet is invisible on this page.

## What to add

An "All team members" roster section on the Staff tab, always visible (independent of the date picker):

- Lists every employee for the business, sorted by name.
- Each row: avatar initial, name, position, email/phone, and a status chip (On shift today / No shift today / Unavailable).
- Search box to filter by name, email, or position.
- Clicking a row opens the existing employee profile dialog.
- Owner-only inline actions kept as they are today (Assign stays in the duty columns).
- Collapsible: roster shown by default, duty columns below it.

The existing duty view (date picker, On shift now, three status columns) stays exactly as-is underneath.

## Technical notes

- `src/components/dashboard/StaffList.tsx` already fetches all employees for the business; the roster can reuse that `employees` state, so no new query is needed.
- Move the "No staff yet" empty state to cover the whole page; the "No shifts scheduled" state applies only to the duty section.
- New presentational component `src/components/dashboard/StaffRoster.tsx` to keep `StaffList` manageable; it receives employees, the shift map, and an `onSelect` callback.
