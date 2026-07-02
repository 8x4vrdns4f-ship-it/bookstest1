Two focused batches. We ship A first, then B in a follow-up.

## Batch A — Branded public booking page (`/book/:userId`)

Today the page is a bare iframe centered on a blank background. We wrap it in a trust-building, on-brand shell so customers know who they're booking with.

**What the customer sees**
- Hero band with the business name, category tagline, and (if set) address + phone.
- The existing booking widget iframe, unchanged, in a card with soft shadow.
- Reassurance strip below the widget: "Secure booking", "Instant confirmation", "Cancel free up to X hours" (X pulled from `cancellation_hours`).
- Footer line: "Powered by BookSuite" linking to the marketing site.
- Loading skeleton while business info is fetching; graceful fallback if the profile has no `business_name` (shows "Book an appointment").

**Data**
- One public `select` against `company_settings` by `user_id` for: `business_name`, `business_category`, `business_address`, `business_phone`, `accent_color`, `welcome_message`, `cancellation_hours`. Requires a public-read RLS policy on those columns (row filtered by `user_id` param) — confirm/add if missing.
- No auth. No mutations. Widget iframe keeps handling the actual booking flow.

**SEO**
- `<SEO>` title becomes `Book with {business_name} — BookSuite`.
- Description uses `welcome_message` when present, else a generic line.
- Add `LocalBusiness` JSON-LD when address/phone are set.

**Design**
- Reuse dark theme tokens and `SectionCard`. Accent header uses `--primary` (fall back to the profile's `accent_color` only as a subtle top border, not a full recolor — keeps design system intact).
- Mobile: hero stacks, widget goes full width with 16px padding.

**Files touched**
- `src/pages/PublicBooking.tsx` — replace layout, add data fetch.
- new `src/components/booking/PublicBookingHeader.tsx`, `PublicBookingTrustStrip.tsx`.
- possibly one migration to add a public-read policy on `company_settings` if not already permitted.

**Out of scope for A**
- Business logo upload (no field exists yet — would need storage bucket + settings UI; flag for later).
- Reviews/testimonials (no data model).
- Changing the widget itself.

---

## Batch B — First-run onboarding wizard

Right after signup, drop the user into a 4-step wizard before the dashboard. Skippable, resumable, and never shown again once completed.

**Steps**
1. **Business basics** — `business_name`, `business_category`, `business_phone`.
2. **Hours** — quick preset (Mon–Fri 9–5, Tue–Sat 10–6, custom) writing to `working_hours`.
3. **First service** — name, duration, price. Creates one row so the booking widget isn't empty.
4. **Share your link** — shows the `/book/:userId` URL with copy button and a "Connect payments later" nudge linking to Settings → Payments.

**Behavior**
- Route: `/onboarding`. Guarded — redirects to `/dashboard` if `company_settings.onboarding_completed_at` is set.
- After Auth signup success, redirect new users to `/onboarding` instead of `/dashboard`. Existing users skip it.
- Each step saves on Next; back navigation preserves entered data.
- "Skip for now" on every step; final step also has "Finish". Both mark `onboarding_completed_at = now()`.
- Progress bar + step indicator at top; uses `AppDialog`-style shell but as a full page.

**Data**
- Add nullable `onboarding_completed_at timestamptz` to `company_settings` (migration).
- Reuses existing zod schemas from `formSchemas.ts`; adds `onboardingBusinessBasicsSchema`, `onboardingServiceSchema`.

**Design**
- Centered card, max-w-2xl, dark surface, one icon chip per step (`Store`, `Clock`, `Sparkles`, `Link2`).
- Framer-motion slide between steps.

**Files touched**
- new `src/pages/Onboarding.tsx`, `src/components/onboarding/{Stepper,StepBusiness,StepHours,StepService,StepShare}.tsx`.
- `src/App.tsx` — add route.
- `src/pages/Auth.tsx` — post-signup redirect.
- `src/lib/formSchemas.ts` — new schemas.
- one migration for `onboarding_completed_at`.

**Out of scope for B**
- Stripe Connect setup inside the wizard (kept as a Settings nudge — one less thing to fail on first-run).
- Multi-employee setup (single-owner default; team invites stay in dashboard).
- Tutorial tooltips on the dashboard.

---

Approve and I'll build **Batch A** first, then check in before starting **B**.
