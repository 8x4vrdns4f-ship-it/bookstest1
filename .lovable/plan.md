# Dashboard AI assistant: ask about or change anything

A single assistant owners can open from every dashboard page. They type (or ask a question) in plain English; it answers, or prepares a change for them to approve.

## How it looks

- A round assistant button fixed in the bottom-right of every dashboard page (owners only).
- Tapping it slides a panel in from the right (full screen on phones), with suggested prompts that match the page you're on (e.g. on Shifts: "Give Sam Friday off").
- The chat box currently at the top of Settings is replaced by a small "Open assistant" button that opens the same panel, so there's one assistant, not two.
- Same safety rule as today: nothing is saved or sent until the owner presses **Apply** (or **Send** for emails) on a change card. Cancel means nothing happens.
- Same monthly allowance per plan (Silver 20, Gold 100, Platinum 500), shown in the panel.

## What it can do

Answer questions (no changes, no Apply needed):
- Bookings: "What's on tomorrow?", "Any pending requests?", "How many bookings this week?"
- Numbers: revenue, busiest days, most popular service, new vs returning clients, no-shows, for any date range.
- Clients: "When did Jake last visit?", "Who hasn't booked in 60 days?"
- Team: who's working on a given day, leave balances, pending time-off requests.

Make changes (always via an Apply card):
- Everything the Settings assistant does today: opening hours, booking rules, deposits, notifications, booking page, resources, services.
- Bookings: confirm, decline, cancel, or mark complete / no-show.
- Shifts: add, move or remove a one-off shift; change an employee's weekly schedule; approve or decline time-off.
- Clients: add a client or update their details/notes.
- Emails: draft a campaign (subject + message + who receives it) and save it as a draft in Campaigns; a **Send** button sends it through the existing campaign sender.

Plan limits still apply: if something belongs to a higher plan (e.g. campaigns or advanced analytics), the assistant says it's locked instead of doing it.

Not included: inviting/removing staff or changing roles, promo codes, subscription/billing, payment setup, deleting the account, password changes. It says so if asked.

## Technical details

- New edge function `business-assistant` replaces `settings-assistant` (same model and the same two-phase design: `{message, history}` returns `{reply, change_set?}`; `{apply: true, change_set}` writes). The existing settings validation and write logic moves over unchanged.
- Read-only tools run during the chat turn (bookings, analytics aggregates, clients, shifts, time-off, leave balances) with the caller's token so RLS scopes everything to their business. Results are trimmed to small summaries.
- Change sets gain new op types: `booking_ops`, `shift_ops`, `schedule_ops`, `time_off_ops`, `client_ops`, `campaign_draft`. Each is validated server-side and applied with the caller's token; schedule changes call `apply_employee_schedule`, one-off shift edits set `is_override` to match existing rules.
- Campaign Send reuses `send-campaign`; nothing emails without the explicit Send press.
- Owner check, tier gating and `consume_assistant_request()` usage limit enforced in the function, as today. Employees are rejected.
- Frontend: `src/components/dashboard/AssistantPanel.tsx` (sheet + chat, markdown replies, change cards) and a launcher in `AppLayout.tsx`; current route passed to the function for page-aware suggestions. Pages refresh their data after Apply via a shared "data changed" event.
- `AGENTS.md` updated: one assistant function, approval required for every write.
