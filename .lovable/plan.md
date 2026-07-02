## Act 4, Batch 5 — Forms Redesign

Standardize every form in the app so they share one layout language, one validation pattern, and one dialog shell.

### What changes

1. **Validation layer — zod schemas for every major form**
   - `AddEmployeeDialog`: name (min 2 chars), email (valid format), phone (optional, E.164-ish), position (optional)
   - `RolesManager` dialog: role name (required, trimmed)
   - `Auth` page: email + password (min 6) for login; add display-name (min 2) for signup
   - `ResetPassword`: password (min 6) + confirm-password match
   - `JoinCompanyDialog`: company code (required)
   - `Settings` page sub-sections: numeric bounds (deposit >= 10, buffer 0-120, etc.), email format where applicable
   - No business logic changes; schemas only replace the ad-hoc inline checks.

2. **Form primitives — adopt `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormMessage`**
   - Every form field wraps in `<FormItem>` so error messages, helper text, and focus rings are consistent.
   - Labels use `text-foreground font-medium text-sm`.
   - Inputs sit on `bg-secondary border-border` surfaces.
   - Error state: `text-destructive` message below the input, ring tint on the field.

3. **Dialog forms → `AppDialog` shell**
   - `AddEmployeeDialog`: wrap in `AppDialog` with `UserPlus` icon, size `md`
   - `RolesManager` dialog: wrap in `AppDialog` with `Shield` icon, size `md`
   - `JoinCompanyDialog`: wrap in `AppDialog` with `Building2` icon, size `sm`
   - All dialog footers use `DialogFooter` with `Cancel` (outline) + primary action (`premium` or `destructive`)

4. **Settings page — `SectionCard` per accordion section**
   - Replace raw `AccordionItem` card styling (`bg-card border border-border rounded-lg px-4`) with `SectionCard` wrappers.
   - Each accordion section becomes a `SectionCard` with a matching icon chip:
     - Company Info → `Building2`
     - Working Hours → `Clock`
     - Booking Preferences → `CalendarCheck`
     - Notifications → `Bell`
     - Roles & Permissions → `Shield`
     - Check-In → `QrCode`
     - Branding → `Palette` (locked if no custom-branding tier)
   - The accordion stays inside the card body so collapse/expand still works.
   - Save button moves to a sticky bottom bar across all sections, or stays per-section if that’s the current UX — evaluated during implementation.

5. **Auth page polish**
   - Keep the centered `Card` shell (it’s a public page, not dashboard).
   - Refactor fields to use `FormItem` primitives for consistent label/input spacing and error display.
   - Password field keeps the eye toggle; error messages appear below instead of toast-only.

6. **ResetPassword page polish**
   - Same `Card` shell, same `FormItem` field pattern.
   - Add confirm-password field with zod match validation.

### Out of scope for Batch 5
- Mobile motion pass (Batch 6)
- Refactoring non-form dialogs that are already using `AppDialog` correctly
- Widget/iframe forms (those live in `widgetTemplate.ts`, a different surface)
- Payment/checkout forms (those are Stripe-hosted)

### Technical notes
- `react-hook-form` and `@hookform/resolvers` are already available in the project (used by `src/components/ui/form.tsx`).
- `zod` is already in `package.json`.
- All colours stay on semantic tokens (`--card`, `--border`, `--primary`, `--destructive`, `--secondary`).
- No backend or RLS changes.
- No route changes.
