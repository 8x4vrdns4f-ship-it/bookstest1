## Goal
Make every logged-in surface feel like one polished, elegant product — consistent shell, refined components, tighter spacing, better hierarchy — starting from 3 rendered design directions you pick from.

## Approach

### Act 1 — Pick the direction (before any code)
1. Capture the current Dashboard shell as reference (needs you signed in on the preview so I can screenshot the real thing — I'll prompt you if the session isn't there).
2. Generate **3 rendered design directions** for the dashboard shell + a stat card + a primary button, all sharing the locked BookSuite palette (dark base, light-blue accent, Plus Jakarta Sans).
   Each direction varies composition, density, and motion register — not the brand.
3. You pick one. That direction becomes the design system for everything else.

### Act 2 — Build the shell
Once you've picked:
- New `AppLayout` with **collapsible shadcn Sidebar** (icon-collapse variant, always-visible trigger in the header).
- Sidebar sections: Overview, Bookings, Calendar, Clients, Staff, Shifts, Payments, Settings. Active route highlighting via `NavLink`.
- Top header keeps: sidebar trigger, page title/breadcrumb, language/currency switcher, notifications, user menu.
- Move the current top button bar into the sidebar; keep the "Try Now / Login" logic intact on public routes.

### Act 3 — Refresh the design tokens
Update `index.css` + `tailwind.config.ts` with the chosen direction's tokens:
- Refined surface layers (`--surface`, `--surface-elevated`, `--surface-sunken`)
- Softer semantic borders + focus rings
- Elevation scale (`--shadow-sm/md/lg/glow`)
- Gradient primitives for hero cards and CTAs
- Motion tokens (durations, easings) used by Framer Motion

### Act 4 — Systematic component pass
Rebuild these to the new system (one PR-sized batch at a time):
- **Cards**: stat cards, `OnboardingChecklist`, `SubscriptionWidget`, `UsageBanner`, `PaymentsCard`, `GiftCodesCard`, `JoinRequestsCard`
- **Buttons**: primary/secondary/ghost/destructive + new `premium` gradient variant for headline CTAs
- **Tables/lists**: `BookingsList`, `ClientList`, `StaffList` — consistent row density, hover, empty states
- **Dialogs**: `AddEmployeeDialog`, `BookingDetailDialog`, `ManageShiftsDialog`, `PlanShiftsDialog`, `StaffMembersDialog`, `EmployeeProfileDialog`, `EmployeeActionsDialog`, `DateOverrideDialog`, `DayScheduleDialog`, `EmbedWidgetDialog`, `CancelSubscriptionDialog` — shared header/footer pattern, consistent widths, better close affordance
- **Calendar & Shifts views**: `CalendarView`, `ShiftsView`, `ReceptionistView` — cleaner grid lines, better time labels, drag/hover states
- **Charts**: `DashboardCharts` — restyled tooltips, gridlines, legend to match tokens

### Act 5 — Page-level pass
Apply the shell + refreshed components to:
`Dashboard`, `EmployeeDashboard`, `Payments`, `Settings`, `Pricing`, `PendingApproval`, `VerifyEmail`, `ResetPassword`, `Auth`, `BookingSuccess`, `BookingCancelled`, `PaymentsReturn`, `PaymentsRefresh`, `EmbedWidget`, `Kiosk`.

Add empty states, loading skeletons, and consistent page headers (title + description + primary action slot) to each.

### Act 6 — Polish details
- Framer Motion page transitions + card mount animations (subtle, one register)
- Toast styling to match tokens
- Focus-visible rings across all interactive elements
- Mobile pass: sidebar becomes off-canvas, tables become stacked cards, dialogs full-screen
- Dark-mode contrast audit on the new tokens

## Out of scope
- No business logic changes (Stripe, bookings, RLS, edge functions untouched).
- No new features — pure UI/UX refinement.
- Public landing page stays as-is (you liked the current header).

## What I need from you
1. Sign in on the preview so I can screenshot the real dashboard for the directions step.
2. Approve this plan → I'll generate the 3 directions immediately.
