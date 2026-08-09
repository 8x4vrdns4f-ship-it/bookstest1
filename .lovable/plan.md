# Improve the employee-facing experience

Today an employee who signs in gets a single page: a "Available now" toggle and a flat list of upcoming bookings. No shifts, no day view, no client details, no way to mark a job done, no profile. Here's what to add.

## 1. A real employee home ("Today")

- Today's header: date, shift times (from the shift the manager scheduled), and a live "next appointment in X min" line.
- Three quick stats: appointments today, hours on shift, completed today.
- Timeline of today's bookings in time order, with a clear "now" marker so they can see what's next at a glance.

## 2. Booking cards with everything they need

Each appointment shows client name, service, duration, time, party size / table or resource when set, price, and the manager's notes. Tapping a card opens a detail sheet with:

- Tap-to-call and tap-to-email the client.
- The booking notes in full.
- Status actions the employee is allowed to take: Start, Mark completed, Mark no-show. (Cancelling stays with the manager.)

## 3. My schedule

A second tab listing the employee's upcoming shifts for the next two weeks (date, start–end, hours), plus the count of bookings on each day, so they can plan around it. Read-only — managers still own the roster.

## 4. Availability that actually communicates

Keep the "Available now" toggle but make its meaning explicit ("Clients can be assigned to me right now"), and add the simple day status the roster already supports (Available / Unavailable today) so the manager's Staff tab reflects it.

## 5. Profile + account basics

A small profile card where the employee can update their own name, phone, and position, plus sign out and change password. Right now they can't edit anything about themselves.

## 6. Mobile-first shell

Employees will live on their phones. Give the employee area a bottom tab bar (Today / Schedule / Profile), full-width cards, big tap targets, and pull-to-refresh, matching the dark BookSuite look.

## 7. Empty and error states

Friendly states for "no shift today", "nothing booked yet", and "you're not linked to a company yet" with a route back to the invite/join flow.

## Technical notes

- New route shell `src/pages/EmployeeDashboard.tsx` split into `src/components/employee/TodayView.tsx`, `ScheduleView.tsx`, `EmployeeProfileCard.tsx`, and `EmployeeTabBar.tsx`.
- Data comes from existing tables: `bookings` (filtered by `assigned_employee_id` + `user_id`), `employee_shifts`, `employees`, `resources`, `services`. No schema change needed for views.
- Status actions and self-profile edits need RLS/trigger review: `guard_employees_self_update` currently restricts employee self-updates, and booking updates are owner-scoped. Add narrow policies so a linked employee can (a) update `name`, `phone`, `position`, `available_now`, `manual_status` on their own row and (b) update `status` on bookings assigned to them, limited to `in_progress` / `completed` / `no_show`.
- Reuse `EmptyState`, `ListSkeleton`, `SectionCard` for consistency.

## Out of scope for this pass

Employee-initiated time-off requests, shift swapping, in-app chat, and per-employee earnings reporting — good follow-ups once the above lands.
