## Act 4, Batch 3 — Dialogs & Modals

Unify every dialog/sheet/drawer across the dashboard so they match the new Professional Dark aesthetic and feel like one product.

### What changes

1. **Dialog primitive polish** (`src/components/ui/dialog.tsx`)
   - Darker overlay with subtle blur
   - Rounded-xl surface, refined border, layered shadow
   - Tighter header/footer spacing, sticky footer on tall dialogs
   - Consistent close-button hit area

2. **Standardised dialog shell** — new `src/components/app/AppDialog.tsx`
   - Wraps `Dialog` with title, description, icon slot, and footer actions
   - Enforces consistent padding, typography, and `premium` primary CTA
   - Replaces one-off styling in existing dialogs

3. **Refactor key dialogs to use `AppDialog`**
   - `StaffMembersDialog` (staff stat popup)
   - `AddEmployeeDialog` / invite flow
   - `BookingDetailsDialog` + edit/cancel confirmations
   - `ClientDetailsDialog`
   - `GiftCodeRedeemDialog` and admin create dialog
   - Shift editor modal inside `ShiftsView`
   - Confirm/destructive dialogs (cancel booking, remove employee, delete gift code) → unified `ConfirmDialog` variant with warning token

4. **Sheets & Drawers**
   - Align mobile sheet styling (side padding, header) with the new dialog look
   - Notification popover spacing tightened to match

5. **Micro-interactions**
   - Framer-motion fade+scale on open (respects `prefers-reduced-motion`)
   - Focus ring uses accent token

### Out of scope for Batch 3
- Calendar view, forms redesign, and mobile pass — those are Batches 4–6.

### Technical notes
- No business logic changes; only presentation and shared primitives.
- All colours via semantic tokens (`--card`, `--border`, `--primary`, `--warning`).
- `AppDialog` accepts `size: sm | md | lg` and `tone: default | destructive`.

Say "go" and I'll build it.
