## Reminders & reviews toggles in Settings

The reminder toggle already exists and is honored by the `send-booking-reminders` cron. This adds the missing **review request** toggle and keeps everything consistent.

### Database
- New column on `business_settings`: `notify_client_review_request boolean NOT NULL DEFAULT true`.

### Cron function
- `supabase/functions/send-review-requests/index.ts`
  - Select `notify_client_review_request` alongside `business_name`.
  - Skip bookings whose owner has the toggle set to `false`.

### Settings UI
- `src/pages/Settings.tsx`
  - Add `notify_client_review_request` to the form state, load, and save payload.
  - New `ToggleRow` under Notifications: "Client Review Request — Ask clients for a review after their appointment."
  - Reorder for clarity: owner-focused toggles first (new booking, daily summary), then client-facing (confirmation, reminder, review request).

### Small clarity touches (UI only)
- Rename "Email Notifications" → "New Booking Email" (hint unchanged) so its purpose is obvious next to the others.
- Group hint copy so each toggle clearly says who receives the email.

### Out of scope
- Per-employee or per-service overrides.
- Custom reminder timing (stays at 24h before).
- Editing the email templates themselves.
- Owner digest of new reviews.
