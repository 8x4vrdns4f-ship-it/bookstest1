# Why the employee invite never arrived

## What actually happened

The invite email *was* created and sent. It then bounced permanently.

Email log for that invite:

```text
21:12:53  employee-invited  wessexkinggdom@tmail.com  pending
21:12:54  employee-invited  wessexkinggdom@tmail.com  sent
21:12:57  system            wessexkinggdom@tmail.com  bounced
          "Permanent bounce — email address is invalid or rejected"
```

The address used was `...@tmail.com`, not `gmail.com`. That domain rejected the
message, so nobody received it.

Two knock-on effects:

1. That address is now on the blocked (suppressed) list, so any future email to
   it is silently dropped — even if it were valid.
2. The dashboard still said "has been invited via email" because the app never
   waits for or checks the send result. It shows a success message regardless of
   whether the email went out, bounced, or was blocked.

## The fix

**1. Tell the truth in the confirmation message**
Wait for the send result before showing the toast, and show one of:
- "Employee added — invite sent to <email>"
- "Employee added, but the invite email couldn't be sent" (with the reason, e.g.
  the address is on the blocked list after an earlier bounce)

**2. Catch obvious typo domains before sending**
Warn on near-miss domains (`tmail.com`, `gmial.com`, `gmail.co`, `hotmial.com`,
`outlok.com`, `yaho.com`, etc.) in the Add Team Member form: "Did you mean
gmail.com?" with the option to correct it or send anyway.

**3. Add a "Resend invite" action to the staff list**
For staff who haven't joined yet, an action to resend the invite, plus an
"Invite bounced / blocked" badge when the last send to that address failed, so a
bad address is visible instead of silently doing nothing.

**4. Show the company code as a fallback**
Include the company code in the add-employee success message so the owner can
pass it on directly if email fails.

**5. Clean up the blocked entry (optional)**
If `wessexkinggdom@tmail.com` was a typo, no action needed — just re-add the
person with the correct address. If it is genuinely their address, the block
entry needs removing before email can reach them again.

## Technical notes

- `src/components/dashboard/AddEmployeeDialog.tsx`: `sendEmail(...)` is
  fire-and-forget (not awaited) and the toast is hardcoded to the success case.
  Await it, read the response, branch the toast.
- `src/lib/sendEmail.ts`: currently swallows the result. Return
  `{ ok, reason }` so callers can react — the send function already returns
  `{ success: false, reason: 'email_suppressed' }` for blocked addresses.
- Typo check and resend action are frontend-only; the resend reuses the existing
  `employee-invited` template with a fresh idempotency key.
- Bounce/block state comes from the existing email log and suppression records;
  read via a small query in the staff list, no schema changes.
