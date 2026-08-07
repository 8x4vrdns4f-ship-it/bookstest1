# Hero + trust signals refresh

Two changes to the landing page top section, with all claims matched to how the product actually works.

## Verified facts to use (no invented claims)

- Trial is **30 days**, applied via Stripe `trial_period_days = 30` at checkout.
- The trial **requires a card** and is **one per customer** (repeat trials are blocked).
- Plans start at **£1.99/mo**, top tier **£11.95/mo**, 3 plans.
- Cancel anytime from the dashboard; access lasts to the end of the billing period.
- No customer-count or revenue numbers exist, so no "join X businesses" style proof line.

There is a live contradiction to fix: the final CTA copy says "Free to start, no card required" while pricing says a card is required. All trial wording will be aligned to "30-day free trial, card required, cancel anytime before it ends".

## 1. Hero section

Current hero leads with the logo, a long dense paragraph, and three buttons of near-equal weight.

- Add a real visible headline (replacing the screen-reader-only H1) with an outcome-led line, e.g. "Take bookings, deposits and payments — without the back-and-forth". Logo stays above it, smaller.
- Shorten the tagline to two lines: what it does + who it's for. Move the detail (staff shifts, reminders, widget) into the checkmark row and the sections below.
- CTA hierarchy: **Start 30-day free trial** as the single primary button, "Explore pricing" as a quiet outline link, and "Join a company" demoted to a small text link underneath so it stops competing.
- Under the CTAs add one honest support line: "Plans from £1.99/mo after the trial. Cancel anytime."
- Keep the video placeholder exactly as is.
- Translated strings (`hero.tagline`, `hero.try`, `hero.pricing`) get updated across all languages; new keys added with English fallback where a translation isn't provided.

## 2. Trust signals

- Promote the checkmark row directly under the CTA into a clearer, higher-contrast row: "30-day free trial", "Card required, cancel before it ends", "No setup fees", "Your own Stripe payouts".
- Make the wording explicit about the card so nobody is surprised at checkout.
- In the social proof strip, replace vague metrics with verifiable capability claims: Stripe-powered deposits and payouts, 38 languages with auto currency, embeddable widget for any site, automatic email confirmations and reminders. Drop "Live in under 5 minutes" unless you want to keep it as an aspiration.
- Keep the industry chip row, it reads well.
- Fix the final CTA copy so it no longer says "no card required".

## Technical notes

- Files: `src/components/HeroSection.tsx`, `src/components/landing/SocialProofStrip.tsx`, `src/i18n/translations.ts` (hero + cta keys across the 38 locales), `src/components/landing/FinalCTA.tsx`.
- Presentation-only; no backend, pricing, or checkout logic changes.
- Uses existing semantic tokens (`primary`, `muted-foreground`, `border`); no new colours.
