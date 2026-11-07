# BookSuite — project notes

Structural decisions and conventions for this codebase. Keep each rule to one line plus a why.

## Email

- All outbound email goes through `sendTemplateEmail` in an Edge Function (`supabase/functions/_shared/transactional-email-templates/`). Why: Lovable's managed API owns retries, suppression and unsubscribe; browser code must never send.
- `supabase/functions/_shared/sender-identity.ts` is the single source of truth for who a customer email appears to come from (`email_from_mode` / `email_from_local` on `business_settings`). Why: identity must not drift per template, and the sending address itself always stays on the verified `booksuite.online` domain — never offer per-customer domain verification.
- Unauthenticated email triggers get their own Edge Function that first proves the app row exists (`confirm-waitlist-join`). Why: `app-email` only accepts authenticated callers, so a widget visitor cannot call it, and a public sender must not become a free email trigger.

## Auth & roles

- Roles live in `user_roles` and are checked with the `has_role` security-definer function; only the platform owner holds `admin`. Why: role columns on profiles invite privilege escalation.
- Sessions minted for QA with `lovable auth-session` are restored in Playwright via `page.evaluate`, never `add_init_script`. Why: init scripts leak tokens into any origin visited later.

## Frontend

- Route-level `React.lazy` in `src/App.tsx` with a delayed `PageFallback`. Why: keeps the landing bundle small without a loading-flicker.
- Colours, shadows and radii come from the tokens in `src/index.css`; never hardcode colour utilities. Why: dark mode and theming depend on them.
- Booking calendar-date display uses a dedicated formatter, separate from email formatting. Why: presentation changes must not alter stored dates or email payloads.

## Booking widget

- Widget look (accent/bg/text/font/radius/logo) lives on `business_settings` and is applied at runtime by the widget script from `get_widget_settings`, which falls back to defaults unless the tier allows `custom_branding`. Why: embeds already on customer sites update without re-copying code, and gating stays server-side.
- Widget logos are stored as small resized data URLs in `widget_logo_url`, not in Storage. Why: public buckets are blocked on this workspace.

## Shifts

- Weekly schedules live in `employee_schedules` (one per employee) and are expanded into `employee_shifts` ~12 weeks ahead by `apply_employee_schedule`; `extend_business_schedules` tops up on Shifts page load. Why: the rest of the app (staff view, holiday counting) only reads concrete shifts.
- Hand edits set `employee_shifts.is_override`, and days switched off are stored in `employee_shift_skips`. Why: re-applying a schedule must never undo one-off changes.
- Plan allowances (incl. AI assistant monthly requests) live in tier_* SQL functions and are enforced in the database; `src/lib/tierLimits.ts` mirrors them for display. Why: limits must hold even if the UI is bypassed.
- Booking fees are flat per booking with a monthly cap: every charge path calls `reserveBookingFee` (DB `reserve_booking_fee`, one row lock per business+UK month, unique per booking ref) before charging, then `confirmBookingFee` on success or `releaseBookingFee` on failure; pure rules in `_shared/booking-fee-rules.ts` (unit-tested). Why: two charges at once must never exceed the cap or charge one booking twice.
- Subscription price lookup keys and their tier live only in `_shared/plan-prices.ts` (used by create-checkout and check-subscription). Why: monthly and annual prices must always map to the same plan.
- Automatic staff assigning happens only in the `auto_assign_booking` BEFORE INSERT trigger on `bookings` (mode on `business_settings.auto_assign_mode`, links in `resources.default_employee_id` / `service_employees`), and only picks staff on shift and not on leave. Why: every booking path (widget, manual, assistant, approvals) gets the same rule in one place.

## Self check-in

- Signed-out kiosk check-in goes only through the `kiosk-check-in` Edge Function (rate-limited, fail closed, generic errors, confirmed bookings within ±30 min in the business timezone); `check_in_by_code` is service-role only. Why: public callers must not be able to guess codes, check in from home, or learn client details.

## AI assistant

- One owner-only assistant (`business-assistant` Edge Function, opened from every dashboard page) answers via read tools and only writes through a proposed change set the owner Applies/Sends. Why: owners must approve every change or email, and limits/validation live server-side.

## SEO

- Industry landing pages are one template (`/for/:slug`) driven by `src/lib/niches.ts`; new niches also go in `scripts/generate-sitemap.ts`. Why: one page design, content edited in one place, and Google finds every page.

## Form fields

- Use `DateField` / `TimeField` / `NumberField` from `src/components/ui/date-time-fields.tsx` instead of native `type="date|time|number"` inputs. Why: native boxes fire half-typed values that reset the field; these pickers only emit complete values.

## Refunds & cancellations

- Staff cancel/decline only via the `cancel-booking-owner` Edge Function; Stripe refunds only via `_shared/booking-refund.ts`, with amount rules in `_shared/refund-rules.ts` (unit-tested). DB triggers block non-service-role cancels of paid bookings, edits to payment columns, and deletes of bookings with any payment record. Why: money must never be kept, lost or silently fail to refund because one UI path forgot.
- Every refund first claims the booking atomically (`lockForRefund` → `payment_status='refund_processing'`, 409 if already claimed) and passes a Stripe idempotency key from `refundIdempotencyKey`. Why: double clicks or owner+client cancelling at once must never refund twice or send false failure emails.
- Booking-payment costs (Stripe fees above the standard 1.5%+20p, refund/chargeback shortfalls, dispute fees) go on the business's tab in `business_ledger` (unique `stripe_object_id`), with money rules in `_shared/ledger-rules.ts` and webhook money handlers in `_shared/payment-events.ts` (both unit-tested). Why: BookSuite must never carry booking-payment costs, and every Stripe-driven write must be replay-safe.

## Cancellation policy wording

- Client-facing policy text comes from `src/lib/cancelPolicy.ts` (screens), `cancelPolicyLine` in `_shared/refund-rules.ts` (emails) and `renderPolicy` in `widgetTemplate.ts`; a test asserts the first two match. Why: clients must see identical terms before paying, in emails and when cancelling.
- Connecting payments requires `business_settings.payments_terms_accepted_at`, enforced in `connect-create-account`. Why: owners must accept refund/fee/chargeback responsibility before taking money.
- Accept charges use the service-only atomic `claim_pending_booking_charge` RPC to increment `charge_attempts`, and Stripe keys include that attempt. Why: concurrent acceptance has one winner while a declined-card retry is a new attempt.
- Browser booking inserts reset payment details; updates protect money fields on recorded payments, treating the non-null `unpaid` default as no payment record. Why: manual bookings remain editable without allowing forged payment records.
