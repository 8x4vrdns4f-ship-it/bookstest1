# Polish pass — everything else

Same treatment as the widget and main dashboard: keep the dark theme, blue accent, Jakarta Sans, and existing layouts. No redesign, no new palette, no logic changes. Just tighten spacing, typography, borders, radii, empty states, and status styling so every screen feels like one product.

## Shared surfaces (finish the pass)

- **`AppLayout`** — verify page gutter (px-6/py-8) and max-width consistent on every route.
- **`Button`** — audit heights (36/40/44), radius (12), focus ring, subtle hover; no glow.
- **`Input` / `Select` / `Textarea`** — unify heights, border colour, focus ring, placeholder colour.
- **`Table` rows** — 11px uppercase muted header, 44px row height, hover tint, divider colour.
- **`Badge`** — reuse `status-pill` / `status-dot` variants everywhere (not just BookingsList).
- **`Tabs`** — refined trigger padding, underline vs pill consistent per context.
- **`Dialog` footers** — consistent right-aligned button row via `AppDialog`.

## Dashboard sub-pages (per-page pass, no logic)

- **Bookings** (`BookingsPage`, `BookingRequestsCard`, `BookingDetailDialog`) — align filter bar, status pills, code badge (font-mono), empty state.
- **Calendar** (`CalendarPage`, `CalendarView`, `DayScheduleDialog`, `DateOverrideDialog`) — day/week grid lines, "today" tint, event pill styling matching status colours.
- **Clients** (`ClientsPage`, `ClientList`) — table polish, avatar circle, empty state.
- **Staff** (`StaffPage`, `StaffList`, `StaffMembersDialog`, `AddEmployeeDialog`, `EmployeeProfileDialog`, `EmployeeActionsDialog`, `RolesManager`) — card grid, role chip, dialogs.
- **Shifts** (`ShiftsPage`, `ShiftsView`, `ManageShiftsDialog`, `PlanShiftsDialog`) — schedule grid, shift block styling.
- **Reviews** (`ReviewsPage`) — rating stars, review card, empty state.
- **Receptionist / Kiosk views** (`ReceptionistView`, `Kiosk`) — large-tap targets kept, restyled to match.

## Non-dashboard app pages

- **Settings** (`Settings.tsx`) — section cards, form grid, save bar.
- **Payments** (`Payments.tsx`, `PaymentsCard`, `PaymentsReturn`, `PaymentsRefresh`) — Connect status card, action buttons.
- **Onboarding** (`Onboarding.tsx`) — step layout, progress indicator.
- **Auth flows** (`Auth`, `VerifyEmail`, `ResetPassword`, `PendingApproval`) — form card polish, consistent with landing.
- **Public booking-adjacent** (`ManageBooking`, `BookingSuccess`, `BookingCancelled`, `SubmitReview`) — align with widget styling.
- **More panel sub-views** (Analytics, Cloud, Security, SEO placeholders) — SectionCard grid.

## Out of scope

- No landing page changes.
- No widget changes.
- No route, data, RPC, or edge-function changes.
- No security-finding fixes (separate task if wanted).
- No palette/theme swap.

## Verification

Playwright screenshot of each page after its pass; visual check that shared components render identically across pages.
