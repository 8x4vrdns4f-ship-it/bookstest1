Revert the hero to the original layout, but keep the trust-badge details with corrected copy.

## `src/components/HeroSection.tsx`
- Restore the original top block: `sr-only` h1, `<BrandLogo size="lg" />`, tagline `t("hero.tagline")`, the 3 CTAs (Try / Pricing / JoinCompanyDialog). No new headline.
- Restore the right-hand placeholder panel (`aspect-video` bordered secondary box with the `t("hero.video")` label) — reserved for the future advert video.
- Remove the hero dashboard image and its import.
- Keep the trust-badge row under the CTAs, with corrected copy that matches real product terms (verified against `pricing.trial` translations and `interval '30 days'` in the subscription migration; a card IS required for the trial):
  - "30-day free trial"
  - "Cancel anytime before it ends"
  - "No setup fees"

## Cleanup
- Delete unused `src/assets/hero-dashboard.jpg`.

## Not touched
`SocialProofStrip`, `StickyMobileCTA`, alternating section backgrounds, and the OG image all stay as-is.
