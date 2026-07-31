# Empty states + first-run onboarding polish

Goal: a brand-new account should never see a blank screen. Every page should either show data or tell the owner exactly what to do next, and the setup checklist should actually drive them there.

## What's there today

- 3-step onboarding wizard (business basics, hours preset, booking link) with a "Skip for now" option.
- A "Get set up" checklist on the dashboard with 4 steps: verify email, connect Stripe, add a team member, receive first booking. It can be dismissed permanently via local storage.
- A shared `EmptyState` component already used by bookings, clients, staff, reviews, gift codes, waitlist, and requests.
- Some places still use plain grey text instead of the shared empty state: employee dashboard, receptionist view, staff dialog, resources manager, booking detail employee picker.

## Changes

### 1. Make the setup checklist the real first-run guide
- Add steps that matter more than Stripe for a first booking: **set your services/prices**, **share your booking link** (with a copy button inline), and **set your working hours** (mark done when hours differ from empty).
- Give every incomplete step a working action button that navigates to the right place (currently only two steps have one, and the Stripe step just links back to the dashboard).
- Replace permanent dismissal with a **collapse/hide-for-now** behaviour: it comes back on the next session until setup is complete, with a "Don't show again" only after most steps are done.
- Show a short celebratory completion state the first time all steps go green, instead of the card silently vanishing.

### 2. Empty states everywhere, with an action
Convert the remaining plain-text empties to the shared `EmptyState`, each with a primary action:
- Calendar page: "No bookings this week" + Share booking link / New booking.
- Clients page: "No clients yet" + explain clients are created automatically from bookings.
- Staff page: "No team members yet" + Add team member.
- Shifts page: "No shifts scheduled" + Add shift (or a pointer to add staff first if there are none).
- Employee dashboard and receptionist view: proper empty cards instead of grey sentences.
- Resources manager and staff dialog: consistent empty styling.

### 3. Dashboard zero-state
When the business has no bookings and no clients at all, replace the stats-and-charts wall of zeroes with a focused "Let's get your first booking" panel: booking link with copy, embed-widget button, and a link to preview the public booking page as a customer sees it. Stats and charts return as soon as there is any activity.

### 4. Onboarding wizard polish
- Add a step-4 "You're all set" summary listing what's already configured and what's next, linking straight into the dashboard checklist.
- Make "Skip for now" less final: skipping still leaves the checklist visible on the dashboard (already the case) and shows a toast explaining that.
- Preview of the booking link opens in a new tab so the owner can see their own page immediately.

### 5. Loading skeletons
Where pages currently render nothing while fetching (dashboard cards, calendar, lists), show lightweight skeletons so a slow first load doesn't look like an empty account.

## Technical notes

- All new UI reuses `EmptyState`, `SectionCard`, `PageHeader`, and existing semantic tokens — no new colors or component language.
- Checklist completion is derived from live queries (services/resources count, working hours, bookings count, employees count, Stripe status) — no new tables or columns needed.
- Hide-for-now state moves from `localStorage` permanent flag to a session-scoped flag.
- No backend or schema changes.
