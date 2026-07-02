## Act 4, Batch 4 — Calendar & Pages

Polish the calendar and shift-management surfaces so they feel as refined as the rest of the dashboard.

### What changes

1. **CalendarView polish** (`src/components/dashboard/CalendarView.tsx`)
   - Replace raw `Card` with `SectionCard` wrapper for consistent surface/border
   - Day-cell grid: tighter spacing, clearer booking-density dots (replace text-list overflow with coloured dot indicators)
   - Today highlight uses primary ring instead of solid fill
   - "Closed" / "Custom" chips use semantic badge tokens
   - Empty month state via `EmptyState`
   - Responsive: scrollable on very small viewports

2. **Calendar dialogs refactored to `AppDialog`**
   - `DayScheduleDialog` → `AppDialog` shell with icon (`Calendar`), title (date), size `lg`
   - `DateOverrideDialog` → `AppDialog` shell, size `sm`
   - Time-slot rows kept as-is (custom content), but header/footer spacing unified

3. **BookingDetailDialog refactor**
   - Wrap in `AppDialog` with `User` icon, size `md`
   - Footer actions (Close, Refund) moved to `DialogFooter` using consistent button placement
   - Status/assignment selects stay in body, but section dividers use `border-border`

4. **ShiftsView polish** (`src/components/dashboard/ShiftsView.tsx`)
   - `SectionCard` wrapper for the shift rows table
   - Empty-state when no employees (`EmptyState` with `CalendarDays` icon)
   - Row hover highlight, tighter time-input grouping
   - Save button moved to sticky footer inside card or pinned below
   - Preset/date-range controls use consistent `secondary` input surfaces

5. **Page-level consistency**
   - `CalendarPage`, `ShiftsPage` wrappers verified: `PageHeader` + content, no extra wrapping divs
   - Ensure all calendar/shift surfaces respect the `--card` / `--border` token system

### Out of scope for Batch 4
- Forms redesign (Batch 5)
- Mobile motion pass (Batch 6)
- Refactoring non-calendar dialogs (Gift codes, Clients, etc.) — those follow in later batches

### Technical notes
- No business logic changes; presentation and layout only.
- All colours via semantic tokens (`--card`, `--border`, `--primary`).
- `AppDialog` sizes used: `sm` for overrides, `md` for booking details, `lg` for day schedule.
- `EmptyState` and `SectionCard` already exist from Batch 1/2.