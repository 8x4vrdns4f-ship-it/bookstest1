Polish the landing page to convert better without changing app functionality.

## 1. Hero upgrade
- Replace the empty "video placeholder" box in `HeroSection.tsx` with a real dashboard mockup image (generated 1200x800 screenshot-style illustration showing the calendar + bookings list).
- Add a headline above the logo: "Bookings, clients & staff — one dashboard." with the current tagline as the subhead.
- Add a small trust row under the CTAs: "Free 14-day trial · No credit card · Cancel anytime".

## 2. Sticky mobile CTA
- New `src/components/StickyMobileCTA.tsx`: fixed bottom bar on mobile only (`md:hidden`), with "Start free trial" button. Hides when scrolled past the FinalCTA section. Mounted in `Index.tsx`.

## 3. Social proof strip
- New `src/components/landing/SocialProofStrip.tsx` placed right under the hero: a thin bar with 4 stats (e.g. "Trusted by salons, studios & clinics", "Instant deposits via Stripe", "6 languages", "Setup in under 5 minutes"). Uses existing design tokens.

## 4. Real OG preview image
- Generate a 1200x630 branded OG image (BookSuite logo + tagline on dark bg with blue accent).
- Upload via `lovable-assets` so it has an absolute CDN URL.
- Wire `og:image` and `twitter:image` into `index.html` using that absolute URL.

## 5. Section polish
- Add subtle section dividers / alternating bg (`bg-card/30`) to `HowItWorks`, `ExpandedFeatures`, `Testimonials` so the page has visual rhythm instead of a flat scroll.
- Tighten spacing on `FinalCTA` on mobile.

## Not doing this pass
- Full redesign / new palette (keep the dark theme + blue accent per project memory).
- New translations for the new copy — English only for now; existing `t()` keys still work. We can localize in a follow-up.
- SEO/GSC verification, analytics events, onboarding flow (separate tracks).

## Files touched
- `src/components/HeroSection.tsx` (edit)
- `src/components/StickyMobileCTA.tsx` (new)
- `src/components/landing/SocialProofStrip.tsx` (new)
- `src/pages/Index.tsx` (edit — mount new components)
- `src/components/landing/HowItWorks.tsx`, `ExpandedFeatures.tsx`, `Testimonials.tsx`, `FinalCTA.tsx` (light spacing/bg tweaks only)
- `index.html` (add og:image + twitter:image)
- `src/assets/hero-dashboard.png` + `.asset.json` (new, generated)
- `src/assets/og-image.png` + `.asset.json` (new, generated)
