# Smart integrations: Google Calendar two-way sync

Give every business owner the ability to connect their own Google Calendar so bookings sync both ways. This makes BookSuite feel like part of their existing workflow rather than a separate tool they have to keep checking.

## What owners get

A "Connected Calendars" section in `/settings` where each owner can sign in with Google and pick which calendars to sync.

**BookSuite → Google Calendar**
- When a new booking is confirmed, a calendar event is created on the owner's connected calendar with the client name, service, staff/resource, and a link back to the booking detail.
- When a booking is rescheduled or cancelled, the event updates or removes itself automatically.

**Google Calendar → BookSuite**
- Busy times from the owner's selected Google Calendar block availability in the public booking widget, so they never get double-booked.
- Owners can mark events as "busy" or "free" in Google and BookSuite respects it.

**Employee calendars (optional first step)**
- Each staff member can also connect their own Google Calendar from the employee dashboard, so their personal appointments block their BookSuite availability.

## Why this first

- Every business owner already lives in a calendar; removing the "two systems" feeling is the fastest way to make BookSuite feel essential.
- It reduces real problems: double-bookings, missed appointments, and owners forgetting to check BookSuite before accepting a slot.
- It is technically bounded: one connector per user, one sync direction at a time, clear edge cases.

## What comes after

1. **WhatsApp/SMS reminders** — replace or supplement email reminders with text messages, which cut no-shows more than any other channel.
2. **Auto-fill for repeat clients** — let clients book again in one tap and pre-fill their details.
3. **Demand-based pricing / quiet-slot discounts** — automatically suggest lower prices during dead hours and premium prices during peak times.

## Technical notes

- Use the **Google Calendar App User Connector** so each business owner (and later each employee) connects their own Google account, not the platform's account.
- Store the encrypted per-user connection key in a new `app_user_connections` table keyed by user ID and connector ID.
- Sync logic lives in edge functions triggered by booking status changes (confirmed, rescheduled, cancelled) and by a periodic pull (every 15 minutes) to catch external calendar changes.
- The public widget's availability check calls an edge function that merges BookSuite busy slots with Google Calendar busy slots for the selected staff/resource/date.
- UI reuses the existing Settings card style, `Button`, and OAuth connect flow helpers.
- Out of scope for this step: Outlook/Apple Calendar sync, calendar colour/theme customisation, and syncing notes/attachments back from Google Calendar.

## Risks / open questions

- Some users may prefer one-way sync only (BookSuite → Google, not the reverse). The initial UI should make this a toggle.
- Google's calendar free-busy API can be slow; we should cache busy windows for a few minutes rather than calling on every widget render.
