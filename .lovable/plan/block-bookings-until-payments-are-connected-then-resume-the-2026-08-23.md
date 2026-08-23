# Block bookings until payments are connected, then resume the QA sweep

## 1. Revert card-free bookings

The card-free path added in the last turn goes away. A business that has not connected payments cannot take bookings at all.

Instead of the raw error that appeared only after a visitor filled in the whole form, the widget checks upfront and shows a clear blocked state:

- Booking widget and public booking page show a short message where the form would be: this business is not accepting online bookings yet, please contact them directly.
- No day picker, no time slots, no card fields, no submit button — nothing to fill in and fail on.
- The waitlist button stays visible if the business has the waitlist enabled, so a visitor still has a way to leave their details.

## 2. Owner-side nudge

So an owner is never surprised by their own dead booking link:

- The dashboard payments card gets a clearly worded warning when payments are not connected: your booking link is not accepting bookings until you finish payment setup.
- The booking-link card and onboarding checklist show the same warning next to the link, rather than presenting it as ready to share.

## 3. Resume the pre-launch QA sweep

Continue where the sweep left off, driving the signed-in app with Playwright:

- Owner actions: confirm and decline a booking, assign staff and resource, mark in progress and complete, cancel, and refund.
- Settings round-trip: services, resources, assignment mode, waitlist, payment mode, rental limits — save, reload, confirm values persist.
- Employee flow: invite a teammate, claim the seat through `/join`, pending approval, employee dashboard, time-off request and manager decision.
- Gift codes: create as owner, redeem on a second account.
- Subscription: upgrade, downgrade, cancel.

Findings get ranked as launch blocker, high polish, or later. Blockers and high-polish items get fixed in the same pass; anything lower is reported back to you before I touch it.

## Technical notes

- `save-pending-booking` returns to rejecting requests with missing Stripe identifiers; the `noPayment` branch and the direct-to-`bookings` insert are removed, restoring the original single gate on `connect_accounts.charges_enabled`.
- `get_widget_settings` keeps returning `payments_enabled`; the widget now uses it to render the blocked state instead of a card-free flow.
- `widgetTemplate.ts` drops the `noPay` branches in the submit handler, the deposit-pill override, and the card-hiding logic.
- Test data created during the sweep is removed once each check passes.
