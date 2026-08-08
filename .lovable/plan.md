# Fix employee invite claiming

## Confirmed cause

The invited employee row exists for the correct company and email, and the matching account is confirmed, but its employee link remains empty. The backend claim function attempts to link the account correctly, then the `guard_employees_self_update` trigger blocks the `auth_user_id` change because the caller is not the business owner. The fallback claim hits the same trigger, while the join page discards that second error and displays the misleading “Invite not found” message.

## Changes

1. **Permit the secure invite claim in the employee guard**
   - Update the employee update guard so an authenticated user may link only an unclaimed employee row to their own account.
   - Require the employee email to match the authenticated account email.
   - Continue blocking role, company ownership, email, and account reassignment changes.
   - Keep owners able to revoke an existing employee link.

2. **Make claim functions deterministic and safe**
   - Preserve company-code and authenticated-email matching in `claim_employee_seat`.
   - Ensure the email fallback cannot claim an employee seat from the wrong company when a company code is available.
   - Return an explicit result for an already-linked matching employee so confirmation reloads are idempotent rather than failing.

3. **Correct join-page error handling**
   - Stop swallowing errors from the fallback claim.
   - Distinguish an expired/mismatched invite from a blocked backend update or temporary failure.
   - Redirect immediately when the employee is already linked, without asking for the password again.

4. **Verify the complete flow**
   - Test a confirmed invited account against the real claim path and verify the employee row stores that account’s ID.
   - Reload the invite and confirm it routes to the correct employee dashboard without a second claim.
   - Verify another signed-in account cannot claim the seat and cannot supply a different account ID.
   - Run focused tests and the database security linter.

## Technical details

- Apply the trigger/function changes through one backend migration; no permissive table policy will be added.
- The authenticated identity continues to come exclusively from the verified auth token (`auth.uid()` and its email), never from browser-supplied ownership data.
- Existing and newly generated invite URLs remain supported.