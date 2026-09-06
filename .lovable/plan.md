# Settings assistant: change your setup by asking

Add a chat-style assistant at the top of the Settings page. The owner types what they want in plain English and the assistant makes the change for them.

Examples it will handle:
- "Open 8am to 8pm Monday to Friday, closed Sunday"
- "Add a table called Window 2 that seats 4"
- "Add a service: skin fade, 30 minutes, £25"
- "Set the deposit to £15 and turn on auto-confirm"
- "Turn off Saturday bookings and stop same-day bookings"
- "Rename my resources to 'Rooms' and let customers pick one"

## How it behaves

1. Owner types a request in the assistant box.
2. The assistant replies with a short plain-English summary of exactly what it will change ("Mon–Fri 08:00–20:00, Sunday closed").
3. Owner presses **Apply** (or **Cancel**). Nothing is saved until Apply is pressed.
4. After applying, the Settings page refreshes so the new values are visible in the normal fields, and the assistant confirms what changed.

It can also answer questions ("what's my cancellation window?") without changing anything.

## What it can change

- Business info: name, phone, email, address, category, currency, timezone
- Working hours per day, including closed days
- Booking preferences: deposit, payment mode, auto-confirm, same-day, buffer, advance window, cancellation window, request expiry
- Notification toggles
- Booking page: welcome message, accent colour
- Resources: add, rename, change seats, activate/deactivate, delete; plus the resource toggles (enabled, label, party size, assignment mode)
- Services: add, rename, change length/price, activate/deactivate, delete; plus the services toggle

Out of scope for this assistant: staff, roles, promo codes, subscription/billing, account deletion, password reset. It will say so if asked.

Plan limits still apply — if a feature belongs to a higher tier (resources, day mode, waitlist, promo codes), the assistant explains it's locked instead of changing it.

## Technical notes

- New edge function `settings-assistant` calling the Lovable AI Gateway (`google/gemini-3.7-flash`) with tool calling; system prompt carries the owner's current settings, resources and services so it can answer and diff correctly.
- Tools return a **proposed change set** only — `{ settings_patch, resource_ops[], service_ops[], summary }`. The function does not write on the first call.
- A second call with `apply: true` and the previously returned change set performs the writes:
  - `business_settings` upsert for the patch (same shape the Save All Changes button uses, so the existing DB validation trigger applies)
  - inserts/updates/deletes on `resources` and `services`, scoped to the caller's `user_id`
- Auth: JWT validated in the function; the owner id comes from the token, never the request body. Employees are rejected. Tier gating re-checked server-side, not just in the prompt.
- Validation before writing: deposit ≥ 10, close > open, hours 00:00–24:00, durations ≥ 5 min, capacity ≥ 1, colour is a hex value. Invalid proposals are rejected with a readable message.
- New component `src/components/dashboard/SettingsAssistant.tsx` rendered at the top of `src/pages/Settings.tsx`, with an input, the proposal card, Apply/Cancel, and a short message history (in-memory only, not stored).
- On apply, the component calls the existing settings loader to refresh form state, and `ResourcesManager` / `ServicesManager` reload via a bumped key.
- Gateway errors (rate limit, credits) surface as visible messages in the assistant, not silent failures.
