# Fix the employee invite & join experience

## What's wrong today

- The owner adds an employee, and the invite email just sends them to the generic signup page with a company code to type in.
- Because nothing links that new account to the seat the owner already created, the person ends up filing a "request to join" — which the owner then has to approve. The owner effectively invites the same person twice.
- Invited employees are created with no role, so even once linked, their permissions are undefined.
- The staff list gives no sign of who has actually accepted, and there's no way to resend or copy an invite link.

## The new flow

**Owner side**
1. "Add Employee" dialog gains a Role picker (from the company's roles: manager, receptionist, employee…), defaulting to Employee.
2. The invite email links to a dedicated acceptance page instead of the generic signup page.
3. Staff roster shows an "Invited / Active" badge, plus per-row "Resend invite" and "Copy invite link" actions, and the company code is visible as a manual fallback.

**Employee side**
1. Clicking the invite opens `/join` with the company code and their email pre-filled and the business name confirmed on screen ("Join Parlourbarber").
2. They only choose a password (name/phone pre-filled, editable) and press Join.
3. On submit: account created, signed in, seat claimed automatically — no approval step, straight into their employee dashboard.
4. If they already have an account, the same page offers "I already have an account" → password sign-in → seat claimed automatically.

**Safety net**
- If an invited person signs up through the normal signup page instead, their seat is claimed automatically on first login by matching their verified email to an unclaimed seat the owner created.

**Unchanged**
- The "Join a Company" self-service request flow stays for people the owner has *not* invited; that one still needs owner approval.

## Technical notes

- New DB function `public.claim_employee_seat_by_email()` (security definer): links `employees.auth_user_id` for the caller when `lower(employees.email) = lower(auth.jwt()->>'email')` and `auth_user_id is null`. Granted to `authenticated` only. Returns the business user id + name.
- `src/lib/routeAfterAuth.ts`: before the pending-approval branch, call the new RPC; if a seat is claimed, route to the correct dashboard for that role.
- New page `src/pages/JoinInvite.tsx` at route `/join` (public), reading `?code=` and `?email=`; uses `lookup_business_by_code` for the business name, then `signUp` (role `employee`) → sign-in → `claim_employee_seat`. Falls back to a "check your email" state if the session isn't returned.
- `AddEmployeeDialog.tsx`: load `company_roles` for the business, add a role select, set `role_id` on insert (default the builtin `employee` role), and point `joinUrl` at `${origin}/join?code=...&email=...`.
- `StaffRoster.tsx` / `StaffList.tsx`: derive invite state from `auth_user_id`, add resend (re-fires `employee-invited` email) and copy-link actions for owners.
- No changes to `request_to_join_company`, `decide_join_request`, or the approvals card.
