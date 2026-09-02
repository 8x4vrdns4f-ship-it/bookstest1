# Land admin accounts straight in the admin panel

Right now signing in as your owner account sends you through the normal business flow, and because that account has no active subscription the subscription guard bounces you to the pricing page — so you never reach the platform overview.

## What changes

1. **Post-login routing** — the sign-in redirect logic checks the admin role first. If the signed-in user has the `admin` role, they go to `/admin` instead of `/dashboard` or `/pricing`.
2. **Never paywalled** — the subscription guard exempts admins, so if you do open `/dashboard` or `/settings` as the admin account you see the app rather than the pricing page.
3. **Always reachable** — an "Admin" entry in the account menu (top-right avatar), shown only when the signed-in user is an admin, links to `/admin`.
4. **Shared role hook** — one small `useIsAdmin` hook querying `user_roles`, reused by the guard, the redirect logic, and the menu item, so the check stays server-side (database), never client storage.

## Verification first

The admin role assignment for `tzdabest@proton.me` cannot be confirmed right now (the database is temporarily unreachable). Step one of the build is to query `user_roles` for that account and, if the `admin` row is missing, insert it — otherwise none of the above will trigger.

## Technical notes

- `src/lib/routeAfterAuth.ts`: add an admin check at the top of `getDashboardRoute()` returning `/admin`.
- `src/components/RequireSubscription.tsx`: allow through when the user is admin.
- `src/components/app/DashboardHeader.tsx`: conditional "Admin panel" dropdown item.
- `src/hooks/useIsAdmin.ts`: new hook; `AdminGuard.tsx` refactored to use it.
- No schema changes beyond the role row; no changes to business-owner or employee behaviour.
