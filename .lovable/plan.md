# Repricing: Silver £20, Gold £150, Platinum £499

## My take

Good move. The current live prices are £199 / £549 / £1,195 a month, which is far above what Calendly, Fresha or Setmore charge — most small salons, barbers and restaurants would bounce off that before trying anything. £20 / £150 / £499 is a much more credible ladder for the market you're targeting.

Two things worth flagging:

- **The gap between Silver (£20) and Gold (£150) is 7.5x.** Silver allows 50 bookings and 1 staff member; Gold allows 300 bookings and 10 staff. That's a steep cliff — a two-person barbershop that outgrows Silver has nowhere to go but a £150 plan. Consider either raising Silver's staff limit to 2-3, or pricing Gold nearer £79-99. Your call; I'll use your numbers unless you say otherwise.
- **Transaction fees stay as they are** (12.5% / 7.5% / 2.5%). At the lower subscription prices those fees carry more of the revenue, which is fine — just worth being aware the mix has shifted.

## What changes

### 1. Stripe prices (the actual amounts customers get charged)

Replace the amounts on the three existing recurring prices, keeping their IDs and lookup keys (`silver_monthly`, `gold_monthly`, `platinum_monthly`) so checkout keeps working with no code change:

| Plan | Now | New |
|---|---|---|
| Silver | £199/mo | £20/mo |
| Gold | £549/mo | £150/mo |
| Platinum | £1,195/mo | £499/mo |

Existing subscribers stay on their current price until they change plan — Stripe does not retroactively reprice active subscriptions. There are no active paying subscribers to migrate at the moment, so this is clean.

### 2. Site copy — fix the display bug at the same time

Separately from the repricing, three places currently show the price 100x too small (they were written as if the stored numbers were pence). Both issues get corrected in one pass:

- `src/pages/Pricing.tsx` — tier amounts become 20 / 150 / 499.
- `src/i18n/translations.ts` — the `hero.support` line in English, Spanish, French, German and Italian becomes "Plans from £20/mo after the trial. Cancel anytime."
- `src/pages/Index.tsx` — the homepage structured data price range becomes `lowPrice: 20`, `highPrice: 499` so Google indexes the real figures.
- `src/components/landing/CompetitorComparison.tsx` — the "Starts from" row becomes "£20/mo". At £20 this now reads competitively against "Free / $12" rather than embarrassingly.

### 3. Verify

Load `/pricing` and the homepage after the change and confirm all three tiers, the hero line and the comparison table show the new figures, and that a checkout session for Silver resolves to the £20 price.

## Technical notes

The Stripe prices are Lovable-managed (they carry `lovable_managed` metadata and lookup keys). Repricing is done by creating a new price against the same price ID, which replaces the old amount and takes over the lookup key — the checkout function resolves by lookup key, so no edge function changes are needed. `tierLimits.ts`, booking caps, staff caps and transaction fee percentages are untouched.
