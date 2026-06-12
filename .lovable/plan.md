## Hook up all app emails

Goal: every meaningful action in BookSuite sends a real email. Today the templates mostly exist but most aren't actually invoked from app code. This plan wires the missing triggers, adds a few missing templates, and verifies delivery.

### Current state

**Templates already built (8):** booking-confirmed, booking-declined, booking-followup, booking-paid-owner, booking-refunded, join-request-approved, join-request-declined, subscription-canceled.

**Already wired:** payment success (verify-booking-payment), Stripe Connect status (stripe-connect-webhook), refunds (refund-booking-deposit), subscription cancel (cancel-subscription).

**Templates exist but NOT triggered anywhere:** booking-confirmed, booking-declined, booking-followup, join-request-approved, join-request-declined.

### What gets added

**1. Wire existing templates to their actions**
- `BookingsList.tsx` → Accept: invoke `booking-confirmed` (to client, with confirmation code). Decline: invoke `booking-declined` (to client, with reason).
- `JoinRequestsCard.tsx` (decide_join_request flow) → Accept: invoke `join-request-approved`. Decline: invoke `join-request-declined`.
- `booking-followup`: send 24h after `status='completed'` via a tiny scheduled job (pg_cron calling a new `send-booking-followups` edge function that scans completed bookings from the prior day and dispatches). Idempotency key per booking so no duplicates.

**2. New templates to add (cover the rest of "most actions")**
- `booking-received-owner` — owner gets pinged when a new pending booking comes in via the widget. Triggered from `create-booking-checkout` after pending row is created (or from `verify-booking-payment` for paid widget bookings — single source so no dupes).
- `booking-reminder-client` — sent ~24h before booking_date to the client. Scheduled job alongside the followup scan.
- `booking-cancelled-client` — when an owner/staff cancels a confirmed booking. Triggered from `BookingDetailDialog` status change to `cancelled`.
- `employee-invited` — when an owner adds an employee in `AddEmployeeDialog`, the invitee gets an email with the company code and a "Join" link.
- `join-request-received-owner` — when an employee submits a join request, the owner gets notified. Triggered from `JoinCompanyDialog` after `request_to_join_company` RPC succeeds.
- `welcome` — sent on first sign-in after email verification (one-shot, keyed by user id). Triggered from `VerifyEmail.tsx` once `email_confirmed_at` flips, with an idempotency key per user.
- `subscription-activated` — when `check-subscription` flips `subscribed` from false→true (first paid month). Idempotency key per `current_period_end` so no spam.

**3. Auth emails (already covered)**
- Signup verification, password reset, magic link, email change — all already routed through `auth-email-hook` and the branded templates. No new work, just confirm they're sending from `noreply@booksuite.online` in a quick test.

**4. Scheduled jobs (new edge function + pg_cron)**
- `send-booking-reminders` (runs hourly): finds confirmed bookings in the 23-25h window not yet reminded; invokes `booking-reminder-client`; marks a `reminder_sent_at` column.
- `send-booking-followups` (runs hourly): finds bookings with `status='completed'` from 20-28h ago, not yet followed up; invokes `booking-followup`; marks `followup_sent_at`.
- Adds two nullable timestamp columns to `bookings` (`reminder_sent_at`, `followup_sent_at`) so they're idempotent.

### Technical notes

- All new templates follow the existing pattern in `_shared/transactional-email-templates/`, registered in `registry.ts`, deployed with `send-transactional-email`.
- Every invoke uses an `idempotencyKey` derived from the source row id + template name (e.g. `booking-confirm-<bookingId>`, `welcome-<userId>`).
- All client-side invokes pass through the existing `send-transactional-email` edge function — no per-action functions.
- The two scheduled functions use service-role to scan and dispatch one email at a time (no bulk sends).

### Verification

After wiring, I'll:
1. Trigger each action in preview and check `email_send_log` for `status='sent'` rows.
2. Confirm From address is `noreply@booksuite.online`.
3. Spot-check one inbox delivery.

### Out of scope

- Marketing/newsletter emails (Lovable doesn't support these — use a dedicated provider if needed later).
- Per-user notification preferences/unsubscribe-per-category (system unsubscribe footer still applies).
- SMS/push notifications.

### Summary of new files/changes

- 7 new templates under `supabase/functions/_shared/transactional-email-templates/` + `registry.ts` updates
- 2 new scheduled edge functions: `send-booking-reminders`, `send-booking-followups`
- 1 migration: add `reminder_sent_at`, `followup_sent_at` to `bookings`; add 2 pg_cron jobs
- Edits to: `BookingsList.tsx`, `BookingDetailDialog.tsx`, `JoinRequestsCard.tsx`, `JoinCompanyDialog.tsx`, `AddEmployeeDialog.tsx`, `VerifyEmail.tsx`, `verify-booking-payment`, `create-booking-checkout`, `check-subscription`
