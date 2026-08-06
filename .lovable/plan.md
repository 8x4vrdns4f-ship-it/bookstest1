# Pre-launch bug bash: full stranger walkthrough

Run the complete product as a brand-new user from a cold start, capture every break or rough edge, then fix them. This is the final sweep before the outreach campaign goes live.

## Scope

Cover every critical path, not just happy path:

1. **Landing → Signup → Verify email**
   - Hero CTA, pricing CTA, navbar "Try Now" all route to signup
   - Email arrives and confirmation link works
   - Expired/invalid link shows resend form (not silent failure)
2. **Onboarding wizard**
   - First business name, type, hours
   - Skipping shows a recovery toast
3. **Settings**
   - Business name, hours, deposit, payment mode, services, resources
   - Save and reload persists values
   - Currency/language switch behaves
4. **Booking link / public widget**
   - Public booking page loads and renders availability
   - Service picker, resource picker, party size, date/time all work
   - Deposit vs pay-in-full vs client-choice flows correctly
   - Payment form completes and confirmation shows
   - Waitlist works when slots are full
5. **Owner dashboard**
   - Bookings list, calendar, staff, clients, reviews load
   - Confirm/decline booking, assign staff/resource, mark in-progress
   - Cancellation/refund flows
6. **Employee flow**
   - Join company via code, pending approval, employee dashboard
   - Employee permissions work
7. **Subscription & billing**
   - Upgrade/downgrade, gift codes, cancellation
   - No "permission denied" or "invalid" errors
8. **Trust pages & public surface**
   - Contact form sends and shows success
   - Cookies banner, footer links, sitemap
   - No console errors, no broken images, no placeholder text leaks

## Method

- Drive each flow with Playwright from a fresh browser context
- Screenshot at every step; capture console logs and failed network requests
- Run both desktop and mobile viewport widths
- Use real email addresses (or the injected auth session) to verify end-to-end

## Deliverable

A ranked punchlist with:
- Repro steps
- Screenshot evidence
- Severity (launch blocker / polish / later)

Then fix all launch blockers and high-severity polish items in the same work stream.

## Out of scope for this pass

- Legal page company details (already placeholder-marked, pending registration)
- Sentry error monitoring (needs a DSN from you)
- New features beyond what is already built
