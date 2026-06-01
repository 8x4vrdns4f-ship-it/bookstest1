---
name: roles-and-join-requests
description: Custom roles per business + employee self-request approval flow
type: feature
---
**Tables**
- `company_roles` — per-business role list. 4 built-ins seeded for every business: owner, manager, receptionist, employee (`is_builtin=true`). Owners add custom roles. Permission flags: `can_approve_requests`, `can_view_all_bookings`, `can_check_in`, `can_manage_settings`.
- `employees.role_id` → FK to `company_roles`. `employees.available_now` boolean for on-call assignment.
- `employee_join_requests` — `status pending|accepted|declined`, `decline_reason`, `assigned_role_id`.

**Helper**: `has_company_permission(uid, business_user_id, perm)` security-definer fn, used by RLS to avoid recursion. Owner always passes.

**RPCs**
- `request_to_join_company(code, name, phone)` — caller must be authenticated; creates a pending request (or reuses an existing pending one).
- `decide_join_request(id, 'accept'|'decline', role_id, reason)` — only callers with `approve_requests` permission. Accept upserts an `employees` row linking `auth_user_id` + role.

**Frontend flow**
- `JoinCompanyDialog` button = "Request to Join Company". Tries legacy `claim_employee_seat` first (pre-add invite path still works → auto-approved), falls back to `request_to_join_company`. After requesting, signs the user out and shows a "waiting" panel.
- `/pending-approval` page (`PendingApproval.tsx`) shows pending / declined state and the decline reason.
- `getDashboardRoute()` resolves: pending request → /pending-approval, owner/manager/receptionist role → /dashboard, other roles → /employee-dashboard.
- Dashboard mounts a `JoinRequestsCard` (realtime subscribed on `employee_join_requests`) with Accept (role picker) and Decline (reason textarea) dialogs.
- Dashboard guards itself by calling `getDashboardRoute` and redirecting if a wrong-role user lands there.

Emails (welcome / declined / new-request notifications) are stubbed until Phase 4 wires the email domain.
