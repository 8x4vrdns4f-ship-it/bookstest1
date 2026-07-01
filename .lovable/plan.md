## Goal
Finish Acts 4–6 of the dashboard polish plan: unify every card, dialog, table, chart, and page under the Professional Dark system, then add motion, empty states, skeletons, and a proper mobile pass. No business logic changes.

## Act 4 — Component pass (one batch at a time)

**Batch 1 — Cards & primitives**
- Add a `StatCard`, `SectionCard`, and `EmptyState` wrapper in `src/components/app/` so every card shares padding, header, icon slot, and hover elevation.
- Add a `premium` gradient variant to `button.tsx` for headline CTAs.
- Restyle: `OnboardingChecklist`, `SubscriptionWidget`, `UsageBanner`, `PaymentsCard`, `GiftCodesCard`, `JoinRequestsCard` on the new primitives.

**Batch 2 — Lists & tables**
- Shared row component: 56px height, hover ring, status pill, chevron affordance.
- Apply to `BookingsList`, `ClientList`, `StaffList`.
- Empty states with illustration + primary action.

**Batch 3 — Dialogs**
- Shared header (title + subtitle + close), footer (secondary/primary), consistent widths (`sm` 440, `md` 560, `lg` 720).
- Refit: `AddEmployeeDialog`, `BookingDetailDialog`, `ManageShiftsDialog`, `PlanShiftsDialog`, `StaffMembersDialog`, `EmployeeProfileDialog`, `EmployeeActionsDialog`, `DateOverrideDialog`, `DayScheduleDialog`, `EmbedWidgetDialog`, `CancelSubscriptionDialog`.

**Batch 4 — Calendar, Shifts, Charts**
- `CalendarView`, `ShiftsView`, `ReceptionistView`: cleaner grid lines, tokenised time labels, hover/drag states, today marker.
- `DashboardCharts`: restyled tooltip, gridlines, axis, legend to match tokens.

## Act 5 — Page-level pass
- `PageHeader` (already scaffolded) applied to every dashboard route with title + description + action slot + breadcrumb.
- Loading skeletons on `Dashboard`, `BookingsPage`, `CalendarPage`, `ClientsPage`, `StaffPage`, `ShiftsPage`, `Payments`, `Settings`.
- Refit standalone pages to the new tokens: `EmployeeDashboard`, `Pricing`, `PendingApproval`, `VerifyEmail`, `ResetPassword`, `Auth`, `BookingSuccess`, `BookingCancelled`, `PaymentsReturn`, `PaymentsRefresh`, `EmbedWidget`, `Kiosk`.

## Act 6 — Polish
- Framer Motion: page transitions (fade+slide 200ms) via a `PageTransition` wrapper in `AppLayout`, card mount stagger.
- Toast (sonner) styled to token surfaces.
- Global focus-visible ring using `--ring`.
- Mobile: sidebar off-canvas trigger in header, tables collapse to stacked cards under `md`, dialogs full-screen under `sm`.
- Contrast audit on the dark palette.

## Order of execution
Batch 1 → Batch 2 → Batch 3 → Batch 4 → Act 5 → Act 6. Each batch is self-contained so you can stop and review after any of them.

## Out of scope
Stripe, bookings logic, RLS, edge functions, translations, landing page.

## Technical notes
- New primitives live in `src/components/app/` to avoid clashing with shadcn `ui/`.
- All colors/shadows/radii come from `index.css` tokens — no hex in components.
- Motion uses existing `framer-motion` install; one duration/easing pair defined as CSS vars.
