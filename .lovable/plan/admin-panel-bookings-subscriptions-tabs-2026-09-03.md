# Admin panel: Bookings & Subscriptions tabs

Two new admin tabs so you can see every booking and every subscription across the whole platform, with search, filters, and drill-down into the owning business — matching the existing admin pages' style.

## What gets built

### 1. Database (one migration, guarded like the rest)
Two new security-definer functions, each starting with the same `has_role(auth.uid(), 'admin')` guard + exception used by `admin_platform_stats` (so non-admins are refused at the data layer, not just the UI):

- `admin_list_bookings(p_limit int default 200)` — most recent bookings platform-wide: business name + user_id, client name/email, service, date, time, status, payment status, charge amount, platform fee.
- `admin_list_subscriptions()` — every subscription joined to owner email and business name: tier, subscribed, status, current period end, trial end, cancelled at, Stripe customer/subscription IDs, created date.

`GRANT EXECUTE` to `authenticated` only; tables themselves get no new grants (functions are security definer, so no new RLS policies needed).

### 2. Pages (`src/pages/admin/`)
- **AdminBookings.tsx** — table of recent bookings: search (client name/email, business name, service), filter chips for booking status and payment status, sortable by date. Clicking a row opens the existing `BusinessDetailSheet` for that booking's business. Summary strip at top: bookings shown, total charged, platform fees in the list.
- **AdminSubscriptions.tsx** — table of all subscriptions: search (owner email, business name), filter by tier and status. Summary strip: active count, per-tier counts, estimated MRR (same math as the Overview card). Clicking a row opens `BusinessDetailSheet`.

### 3. Wiring
- New routes `/admin/bookings` and `/admin/subscriptions` in `src/App.tsx`, wrapped in `AdminGuard` + `AdminLayout` like the other four.
- Two new tabs ("Bookings", "Subscriptions") in `src/components/admin/AdminLayout.tsx`.
- Regenerate database types after the migration.
- Update `roadmap.md`.

## Out of scope
- Editing or cancelling other businesses' subscriptions from the admin panel (read-only for now).
- Refund actions.

## Verification
- As your admin account: both new tabs load real data, search/filters work, rows open the business detail sheet.
- Signed out / non-admin: calling the two new functions returns an authorization error and the routes bounce away.
- Typecheck and build green.
