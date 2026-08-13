# Pre-launch QA sweep and fix punchlist

Run the complete product as a brand-new user from a cold start, capture every break or rough edge, then fix the launch blockers. This is the final sweep before the outreach campaign goes live.

## Scope

Cover every critical path, not just the happy path:

1. **Landing → Signup → Verify email**
   - Hero CTA, pricing CTA, navbar "Try Now" all route to signup.
   - Signup form accepts email and password and creates an account.
   - Confirmation email arrives and the confirmation link works.
   - Expired/invalid link shows a resend form (not silent failure).

2. **Onboarding wizard**
   - First business name, type, hours, currency/timezone.
   - Skipping shows a recovery toast and the dashboard checklist offers a way back.

3. **Settings**
   - Business name, hours, deposit, payment mode, services, resources, assignment mode, waitlist, rental day limits.
   - Save and reload persists values.
   - Currency/language switch behaves.

4. **Booking link / public widget**
   - Public booking page loads and renders availability.
   - Service picker, resource picker, party size, date/time, and day-range rentals all work.
   - Deposit vs pay-in-full vs client-choice flows correctly.
   - Payment form completes and confirmation shows.
   - Waitlist works when slots are full.

5. **Owner dashboard**
   - Bookings list, calendar, staff, clients, reviews, insights load.
   - Confirm/decline booking, assign staff/resource, mark in-progress, cancel/refund.
   - Gift codes can be created and redeemed.
   - Subscription upgrade/downgrade/cancellation works.

6. **Employee flow**
   - Invite employee, claim seat via /join, pending approval, employee dashboard.
   - Employee permissions (view all bookings, approve requests, manage settings, check-in) work.
   - Time-off request and notification flows work.

7. **Trust pages & public surface**
   - Contact form sends and shows success.
   - Cookies banner, footer links, sitemap.
   - No console errors, no broken images, no placeholder text leaks.

## Method

- Drive each flow with Playwright from a fresh browser context.
- Screenshot at every step; capture console logs and failed network requests.
- Run both desktop and mobile viewport widths.
- Use the injected auth session for signed-in paths and real email where needed.

## Deliverable

A ranked punchlist with:

- Repro steps
- Screenshot evidence
- Severity (launch blocker / high polish / later)

Then fix all launch blockers and high-severity polish items in the same work stream.

## Out of scope for this pass

- Legal page company details (already placeholder-marked, pending registration).
- Sentry error monitoring (needs a DSN from you).
- New features beyond what is already built.

## Technical notes

- Scripts live under `/tmp/browser/` so the project checkout stays clean.
- Fixes are limited to the smallest change that resolves the issue; no redesigns.
- After each fix, re-run the affected flow to confirm it passes.
