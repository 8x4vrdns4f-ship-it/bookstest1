# Owner Admin Panel

A private admin area at `/admin` for you (the platform owner) to see everything happening on BookSuite and take support actions — no more doing fixes via raw database queries.

## Current state (verified)
- No admin UI exists today (`/dashboard/*` is business-owner only).
- The `user_roles` table with `app_role ('admin','user')` and the `has_role()` security-definer function already exist and are **empty** — no admin assigned yet.
- Live data to surface: 21 users, 7 businesses, 2 active Platinum subscriptions, 2 bookings, 7 contact messages, 5 gift codes, 213 email log rows.
- Contact messages and gift codes currently have no admin access path, so support actions need new policies.

## What gets built

### 1. Admin access (server-side, not client-only)
- Assign your account (`tzdabest@proton.me`) the `admin` role in `user_roles`.
- New RLS policies using `has_role(auth.uid(), 'admin')` for **select** on: `profiles`, `business_settings`, `subscriptions`, `bookings`, `contact_messages`, `gift_codes`, `employees`, `email_send_log` — and **update** on `contact_messages` (mark handled) and **insert/update** on `gift_codes`.
- New `AdminGuard` route wrapper: checks the role server-side (query `user_roles`), redirects non-admins to home. The `/admin` route sits outside the subscription guard so it never blocks you.

### 2. Pages (`src/pages/admin/`, sidebar-free standalone layout with its own simple nav)
- **Overview** — key metrics: total users, businesses, active subscriptions per tier, estimated MRR, bookings this month, contact messages awaiting reply, recent signups list.
- **Businesses** — table of every business: owner email, name, tier, subscribed/cancelled, bookings count, created date. Search by email/name.
- **Support inbox** — contact messages with handled toggle.
- **Gift codes** — view all codes, create a new one (tier + optional note), see redemption status.

### 3. Wiring
- New routes in `App.tsx` (`/admin`, `/admin/businesses`, `/admin/inbox`, `/admin/gift-codes`).
- Regenerate database types after the policy migration.
- No changes to owner/employee dashboards or public pages.

## Out of scope for now
- Impersonating a business, refunds, or editing other people's data — can be added later if needed.

## Verification
- Sign in and open `/admin` as your account — all four pages render with real data.
- Confirm a non-admin account gets redirected away from `/admin`.
- Typecheck and build green.
