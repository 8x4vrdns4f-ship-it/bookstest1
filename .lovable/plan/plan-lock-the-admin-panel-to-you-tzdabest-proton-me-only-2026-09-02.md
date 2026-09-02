# Plan: Lock the admin panel to you (tzdabest@proton.me) only

## What I verified already
- **Only one admin exists in the database**: `tzdabest@proton.me` (user `b8f8ce72-…`) holds the only `admin` row in `user_roles`. No other account has it.
- **Nobody can self-assign admin**: `user_roles` has no INSERT/UPDATE/DELETE policy for regular users — only "Users can view their own roles" (SELECT own row). Only the privileged service role (used by me/migrations, never exposed to the app) can add admin rows.
- **Routing is role-based, not email-based**: after login, `routeAfterAuth.ts` sends admins to `/admin` and everyone else to their normal dashboard (business owners → `/dashboard`, staff → `/employee-dashboard`). Business owners never see the admin panel.
- **The admin UI is guarded**: `AdminGuard` checks the role server-side (from `user_roles`, never localStorage) and redirects non-admins to `/dashboard`.

## Remaining hardening (to be done)
1. **Server-side function guard**: confirm the four admin database functions (`admin_platform_stats`, `admin_list_businesses`, `admin_business_detail`, `admin_recent_signups`) each begin with a `has_role(auth.uid(), 'admin')` check and raise an error otherwise. Any that don't get re-created with the guard via a migration — so even if someone bypassed the UI, the data calls themselves refuse non-admins.
2. **Confirm grants on user_roles**: verify `anon`/`authenticated` have only SELECT on `user_roles` (no INSERT/UPDATE/DELETE grants); add `REVOKE` statements in the same migration if anything is wider than expected.
3. **Runtime verification**: sign in as your owner account and confirm `/admin` loads; sign in as a test business account and confirm it lands on `/dashboard`, that visiting `/admin` redirects away, and that calling `admin_platform_stats()` directly errors with "not authorized".

## Outcome
- You (and only you) see the admin panel at `/admin`, automatically after login.
- Every other business owner logs into their normal dashboard exactly as before — nothing changes for them.
- Admin access is enforced at three layers: database role, UI guard, and inside the admin functions themselves.
