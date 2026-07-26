## Homepage improvement plan

Four focused upgrades to the landing page, all keeping the current dark theme, light-blue accent, Plus Jakarta Sans, and the existing hero (unchanged, per earlier rule).

### 1. Real product screenshots + live widget demo

- Capture 3 real screenshots from the running app: **Dashboard overview**, **Calendar view**, and the **public booking widget** (already redesigned).
- Run them through the product-shot skill so each sits in a macOS-style window with a soft shadow on a subtle gradient matching the dark theme.
- Save under `src/assets/` and reference via `.asset.json` pointers.
- New component `src/components/landing/ProductShowcase.tsx`:
  - Slotted between `HowItWorks` and `FeaturesStrip`.
  - Tabbed layout: **Dashboard · Calendar · Booking widget**, each tab swapping the framed screenshot with a short "what you're seeing" caption.
- New component `src/components/landing/LiveWidgetDemo.tsx`:
  - Slotted just after `HeroSection` (before the social proof strip) so visitors see the product working immediately.
  - Renders the real widget in an iframe using the existing public embed against a demo business (read-only). Framed inside a mock browser chrome with the caption "Try it — this is a live booking widget."
  - Falls back to a static screenshot if the demo business isn't reachable.

### 2. Industry sections + competitor comparison

- New component `src/components/landing/IndustrySections.tsx`:
  - Tabbed section: **Salons & Beauty · Restaurants · Trades · Clinics · Tutors & Coaches**.
  - Each tab shows: a 1-sentence pitch, 3 bullet benefits framed for that vertical (e.g. Restaurants → tables, party size, deposits for no-shows), and a small screenshot/illustration.
  - Purely presentational — no backend, no new routes.
- New component `src/components/landing/CompetitorComparison.tsx`:
  - Table: **BookSuite vs Calendly vs Fresha vs Setmore**.
  - Rows: monthly price from, per-booking fee, deposits, embeddable widget, staff management, multi-language, custom domain, gift codes.
  - Uses public/marketing-known facts only, phrased neutrally ("Included / Add-on / Not available").
  - Wrapped in a note: "Comparison based on publicly available information as of {month}. Competitor products belong to their respective owners."
- Both sections slot in after `TierComparison` and before `Testimonials`.

### 3. Stronger pricing + trust strip

- Update `src/components/landing/SocialProofStrip.tsx` into a richer **trust strip**:
  - Add a row of business-type badges (Salons, Gyms, Clinics, Restaurants, Tutors, Trades, Mobile services) rendered as small icon + label chips.
  - Keep the existing 4-metric row above it.
- Update `TierComparison.tsx`:
  - Highlight the middle/recommended tier with a "Most popular" ribbon, primary-tinted border, and a larger CTA.
  - Add a **Monthly / Annual** toggle at the top; annual shows "Save ~20%" pill (visual only if annual pricing isn't wired yet — otherwise pipe the real prices through).
  - Primary CTA on each card becomes "Start free" for the free tier and "Try free for 14 days" (or existing copy) for paid, all routing to `/auth?mode=signup`.
- No changes to the underlying tier data or `useSubscription`.

### 4. Performance & Core Web Vitals pass

- **Images**: Convert the new product screenshots + `og-image` to AVIF/WebP variants via `vite-imagetools`; serve `<picture>` with AVIF → WebP → JPG fallback.
- **LCP**: Preload the hero background/image with `<link rel="preload" as="image" fetchpriority="high">` in `index.html`. Mark below-the-fold landing sections (`ExpandedFeatures`, `Testimonials`, `GuidesSection`, `FAQ`, `FinalCTA`, new `IndustrySections`, `CompetitorComparison`, `ProductShowcase`) as **lazy-loaded** with `React.lazy` + `Suspense`, wrapped in an `IntersectionObserver` so they only mount when near the viewport.
- **CLS**: Add explicit `width`/`height` (or `aspect-ratio`) to every image and iframe in the new components; reserve space for the live widget demo so it doesn't jump when it loads.
- **JS**: Audit `Index.tsx` imports; move heavyweight-but-below-fold components behind lazy imports. Confirm no synchronous heavy libs are loaded above the fold.
- **Fonts**: Verify Plus Jakarta Sans is loaded with `font-display: swap` and preconnect to the font host.
- **Verify**: After changes, run a quick Lighthouse-style check locally by loading the page in a headless browser and reporting LCP, CLS, and total JS bytes so you can see the before/after impact.

### Suggested build order

1. New `LiveWidgetDemo` + `ProductShowcase` (screenshots captured + product-shot processed).
2. `IndustrySections` + `CompetitorComparison`.
3. Trust-strip upgrade + `TierComparison` polish.
4. Perf pass: lazy sections, image formats, preloads, CLS fixes, verification.

### Technical notes

- All new components live under `src/components/landing/` and are added to `src/pages/Index.tsx` — no routing changes.
- No database, RLS, or edge-function changes.
- Copy for industry tabs and competitor table stays factual and neutral; I'll draft it in the components and you can tweak wording.
- `SocialProofStrip` label already correctly reads "38 languages, auto currency" from the previous turn — no change needed there.

### Out of scope (say the word if you want any of these too)

- Rewriting the hero.
- Video walkthrough (can add later once we have footage).
- Blog / long-form guides beyond the 3 already shipped.
