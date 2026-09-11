# Signed-in QA sweep before launch

Run the remaining owner/employee/admin flows in a real browser with a signed-in session, capture findings with screenshots, and fix every launch blocker or high-polish issue in the same pass.

## What gets verified

### 1. Admin panel (signed-in owner)
- Land on `/admin` automatically after sign-in.
- Overview loads real metrics and recent sign-ups.
- Businesses tab: search, row drill-down into `BusinessDetailSheet`.
- Bookings tab: search, status/payment filters, sort, row drill-down.
- Subscriptions tab: search, tier/status filters, MRR summary, row drill-down.
- Inbox tab: mark contact message handled/unhandled.
- Gift codes tab: create a code and verify it appears.
- Confirm a non-admin account is redirected away from `/admin` and cannot call admin RPCs.

### 2. Owner dashboard flows
- Dashboard stats, charts, and empty states render at desktop and mobile widths.
- Booking lifecycle: confirm/decline, assign staff/resource, mark in progress, mark complete, cancel, refund path.
- Waitlist entry and review reply.
- Settings round-trip: business details, hours, deposit, payment mode, services, resources, assignment mode, waitlist, rental limits — save, reload, confirm values persist.
- Gift code creation.
- Subscription upgrade/downgrade/cancel flow.

### 3. Employee flow
- Owner invites a teammate.
- Teammate claims the seat through `/join`.
- Pending-approval state, manager approval.
- Employee dashboard: Today, Schedule, Profile.
- Time-off request and manager decision.

### 4. Cross-cutting checks
- Console errors and failed network calls at each step.
- Layout breaks at 390px width.
- Missing translations or placeholder text leaks.

## Method

- Playwright with a signed-in session under `/tmp/browser/`.
- Screenshots at each verification step.
- Console and network logs captured per flow.
- Both 1280px and 390px viewports.
- Any data created is named `QA TEST` and removed once the flow passes.

## Deliverable

A ranked punchlist with repro steps, screenshot evidence, and severity. Launch blockers and high-severity polish items are fixed in the same pass and re-verified. Lower-severity items are reported back before any further changes.

## Out of scope

- New features not already built.
- Legal page company details (placeholder until registration).
- Sentry monitoring setup.
