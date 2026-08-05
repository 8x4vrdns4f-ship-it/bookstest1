# Launch readiness: all four remaining items

Four workstreams, delivered in this order so each one builds on a stable base.

## 1. About + Contact pages

Today the site has Privacy, Terms and Security pages plus a `help@booksuite.online` footer link — no About and no contact form.

- **About page (`/about`)**: what BookSuite is, who it's for, how it works in three steps, and the same "[TO BE ADDED]" company-detail placeholders used on the legal pages so it stays honest until registration.
- **Contact page (`/contact`)**: name, email, subject, message form with validation, plus support email, response-time expectation, and a link to the guides for self-serve answers.
- Messages are stored in a new `contact_messages` table and emailed to the support address through the existing transactional email pipeline. Public insert only — nobody can read submissions except through the backend.
- Both pages get proper titles, meta descriptions and are added to the footer, the sitemap generator, and the landing-page nav.

## 2. Cookies policy + consent banner

- **Cookies page (`/cookies`)**: plain-English list of what's stored (auth session, language, onboarding-checklist flags) and why. No third-party ad cookies to declare.
- **Consent banner**: bottom-sheet on first visit with Accept / Reject / Manage. Choice stored locally, so it appears once. Since the app currently sets only essential and preference cookies, the banner is informational with a genuine reject path for non-essential storage.
- Footer link added alongside Privacy/Terms/Security.

## 3. Rate limits + error monitoring

- **Rate limiting** on the public, unauthenticated edge functions — booking creation, waitlist join, review submission, contact form, and the embed assistant. A shared helper caps requests per IP and per email over a rolling window, backed by a small `rate_limits` table, and returns a clear 429 rather than a silent failure.
- The widget and public forms show a friendly "too many attempts, try again shortly" message instead of a generic error.
- **Error monitoring**: Sentry wired into the React app (with a release tag and user-id-only context, no PII) and into edge functions via a shared error reporter, so production failures surface with a stack trace. Needs a Sentry DSN from you — I'll ask for it when we get there.

## 4. Full stranger walkthrough

Once the above ships, I run the complete flow in a headless browser as a brand-new user: signup, email verification, onboarding wizard, settings and resources, booking link, public widget booking with deposit, confirmation emails, dashboard views, review submission, and cancellation. Output is a punchlist with screenshots of every break and rough edge, then I fix them.

## Technical notes

- New tables: `contact_messages` (public insert, no public read), `rate_limits` (backend-only). Both with RLS enabled and explicit grants.
- Contact email reuses `send-transactional-email` and gets its own template in the existing registry.
- Rate limiting lives in `supabase/functions/_shared/rate-limit.ts` so every public function uses one implementation.
- Sentry DSN stored as a secret for functions and as a build-time env value for the client.
- All new pages reuse `SEO`, `PageHeader`, `SectionCard` and existing tokens — no new visual language.
