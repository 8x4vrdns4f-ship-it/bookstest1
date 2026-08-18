# Signed-in QA sweep (owner + employee)

Your preview session is now available to the sandbox, so the authenticated half of the pre-launch sweep can run. The public surface already passed.

## What gets tested

1. **Dashboard shell** — sidebar routes (bookings, calendar, clients, staff, shifts, reviews, insights) load without errors on desktop and mobile widths; stats, charts, skeletons and empty states render correctly.
2. **Settings** — business details, hours, deposit, payment mode, services, resources, assignment mode, waitlist, rental day limits. Save, reload, confirm persistence.
3. **Booking link** — open the owner's own public booking page, run a real booking end to end (service, date/time, deposit vs full), confirm it lands in the dashboard.
4. **Owner actions** — confirm/decline, assign staff and resource, mark in progress/complete, cancel, refund path, waitlist entry, review reply, gift code create.
5. **Employee flow** — invite a staff member, check the join link, employee dashboard (Today, Schedule, Profile), notifications, time-off request and manager decision.
6. **Cross-cutting** — console errors, failed network calls, broken layout at 390px, missing translations, placeholder text leaks.

## Method

- Playwright with the injected session, scripts under `/tmp/browser/`, screenshots at each step.
- Console and network logs captured per flow.
- Both 1280px and 390px viewports.

## Test data

The sweep needs to create real records (a booking, a waitlist entry, possibly a staff invite) in your live backend to verify the flows. Anything created is clearly named `QA TEST` and removed at the end. Payments use the Stripe test key already configured in the preview, so no real charges.

## Deliverable

A ranked punchlist — repro steps, screenshot evidence, severity — followed by fixing every launch blocker and high-severity polish item in the same pass. Re-run each affected flow after its fix.

## Out of scope

Legal page company details (placeholder until registration), Sentry monitoring (needs a DSN), and any new features.
