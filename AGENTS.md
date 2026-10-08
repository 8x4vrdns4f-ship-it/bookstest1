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

## Booking widget

- Widget look (accent/bg/text/font/radius/logo) lives on `business_settings` and is applied at runtime by the widget script from `get_widget_settings`, which falls back to defaults unless the tier allows `custom_branding`. Why: embeds already on customer sites update without re-copying code, and gating stays server-side.
- Widget logos are stored as small resized data URLs in `widget_logo_url`, not in Storage. Why: public buckets are blocked on this workspace.

## Shifts

- Weekly schedules live in `employee_schedules` (one per employee) and are expanded into `employee_shifts` ~12 weeks ahead by `apply_employee_schedule`; `extend_business_schedules` tops up on Shifts page load. Why: the rest of the app (staff view, holiday counting) only reads concrete shifts.
- Hand edits set `employee_shifts.is_override`, and days switched off are stored in `employee_shift_skips`. Why: re-applying a schedule must never undo one-off changes.
- Plan allowances (incl. AI assistant monthly requests) live in tier_* SQL functions and are enforced in the database; `src/lib/tierLimits.ts` mirrors them for display. Why: limits must hold even if the UI is bypassed.

## SEO

- Industry landing pages are one template (`/for/:slug`) driven by `src/lib/niches.ts`; new niches also go in `scripts/generate-sitemap.ts`. Why: one page design, content edited in one place, and Google finds every page.
