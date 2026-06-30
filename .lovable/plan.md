
## Goal

Add a small language switcher in the top navigation. Selecting a language also switches the **display currency** on marketing/pricing pages, converted from the base price using live exchange rates. Owner-set deposits on the booking widget stay in the business's real currency (that's what Stripe actually charges) but show a converted "≈ €9.20" hint next to the price so international customers understand the amount.

This is display-only conversion. Stripe charges are unchanged — only what the visitor sees in the UI is translated/converted.

## Scope of this first pass

**In scope**
- Language switcher button in the top-right of the `Navbar` (globe icon + current language label, dropdown with 6 starter languages).
- 6 starter locales: English (GB), English (US), Spanish, French, German, Italian. Each maps to a default display currency (GBP, USD, EUR, EUR, EUR, EUR).
- User can independently override currency from the same dropdown (GBP, USD, EUR, AUD, CAD, JPY).
- Selection persists in `localStorage` and applies instantly without reload.
- All visible strings on **landing page, pricing page, footer, navbar, auth page** translated.
- All prices on the **pricing page** and **landing hero/CTA** shown in the selected currency, converted live.
- Booking widget shows a small "≈ $13.50 USD" hint under the deposit when the visitor's currency differs from the business's currency. Stripe still charges in the business currency.

**Out of scope for this pass** (will follow in the "real proper stuff")
- Translating dashboard, settings, emails, edge function responses.
- Letting business owners pick their charging currency per-business (already partially exists via `business_settings.currency`).
- Server-side locale detection / SEO `hreflang` tags (comes with the SEO work in direction A).

## How it works

```text
 ┌──────────────────────┐      ┌────────────────────────┐
 │ Navbar               │      │ LocaleContext          │
 │  [🌐 English ▾]──────┼─────▶│  language: 'en-GB'     │
 └──────────────────────┘      │  currency: 'GBP'       │
                               │  rates: { USD: 1.27 …} │
                               └─────────┬──────────────┘
                                         │ useLocale()
              ┌──────────────────────────┼─────────────────────┐
              ▼                          ▼                     ▼
       <Trans id="hero.title"/>   formatPrice(29)        BookingWidget
       (i18n lookup)              → "£29 / month"        (shows ≈ converted hint)
```

### Technical pieces

1. **Library: `react-i18next`** for translations, with JSON resource files under `src/i18n/locales/{en-GB,en-US,es,fr,de,it}.json`. Lightweight, no SSR concerns, works with Vite out of the box.
2. **`LocaleContext`** (`src/contexts/LocaleContext.tsx`) holds `{ language, currency, rates, setLanguage, setCurrency, format }`. Wraps `App.tsx`.
3. **Exchange rates** fetched once per session from a free public endpoint (`https://open.er-api.com/v6/latest/GBP` — no key required, GBP base). Cached in `localStorage` for 24h. Fallback to a hard-coded rate table if the network call fails so the UI never shows broken prices.
4. **`LanguageSwitcher`** component in `src/components/LanguageSwitcher.tsx` rendered in `Navbar.tsx` (desktop: right side, before auth buttons; mobile: inside the existing menu). Uses the existing `DropdownMenu` shadcn primitive — no new UI library.
5. **`formatPrice(amountInBaseCurrency, baseCurrency='GBP')`** helper on the context: converts via `rates`, formats with `Intl.NumberFormat(language, { style:'currency', currency })`.
6. **Booking widget hint**: in `widgetTemplate.ts`, when rendering the deposit line, also render a `<span class="fx-hint">` populated from a tiny inline fetch to the same rates endpoint, only if the visitor's `navigator.language` implies a different currency than the business's. Pure cosmetic — no change to checkout amount.

### Files touched

- New: `src/contexts/LocaleContext.tsx`, `src/components/LanguageSwitcher.tsx`, `src/i18n/index.ts`, `src/i18n/locales/*.json` (6 files).
- Edit: `src/App.tsx` (wrap with provider, init i18n), `src/components/Navbar.tsx` (mount switcher), `src/components/Footer.tsx`, `src/components/HeroSection.tsx`, `src/components/landing/*` (replace hardcoded copy with `t()` calls), `src/pages/Pricing.tsx` (use `formatPrice`), `src/pages/Auth.tsx` (translate form labels), `src/lib/widgetTemplate.ts` (FX hint).
- Add deps: `react-i18next`, `i18next`, `i18next-browser-languagedetector`.

No database, edge function, or Stripe changes. No secrets needed (the FX API is keyless).

## Translations

I'll write all 6 locales in this pass. Auto-translated by me from the canonical English copy and reviewed for the obvious booking/SaaS terms (deposit, booking, dashboard, subscribe). You can correct any wording later — the JSON files are designed to be edited by hand without touching code.

## After this lands

The next ticket is **Direction A — Growth foundation** (SEO landing pages, public directory, referral system, Terms/Privacy). Internationalisation here unblocks B but A is still the priority for actually getting users.
