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
