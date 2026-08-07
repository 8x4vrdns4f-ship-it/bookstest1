# Fix the "from £1.99/mo" pricing claim

## What's wrong

Your real prices are **£199 / £549 / £1,195 per month** (confirmed against the live Stripe catalogue: `silver_monthly` = 19900p, `gold_monthly` = 54900p, `platinum_monthly` = 119500p). The pricing page renders these correctly.

But a few pieces of marketing copy were written as if those numbers were pence, so they show **£1.99**, **£11.95** and similar — off by a factor of 100. This is a hard-coded copy mistake, not a settings issue, which is why nothing you changed in the dashboard affected it.

## Where the wrong figures appear

| Location | Currently says | Should say |
|---|---|---|
| Hero subline (English + Spanish, French, German, Italian) | "Plans from £1.99/mo after the trial" | "Plans from £199/mo after the trial" |
| Homepage structured data for Google | `lowPrice: 1.99`, `highPrice: 11.95` | `lowPrice: 199`, `highPrice: 1195` |
| Competitor comparison table, "Starts from" row | "£1.99/mo" | "£199/mo" |

## Changes

1. **`src/i18n/translations.ts`** — update the `hero.support` string in all five translated languages to the correct £199 figure, keeping each language's existing phrasing and number formatting.
2. **`src/pages/Index.tsx`** — correct `lowPrice` and `highPrice` in the AggregateOffer JSON-LD block so Google indexes the real price range.
3. **`src/components/landing/CompetitorComparison.tsx`** — correct the "Starts from" value.

No pricing logic, Stripe products, or checkout code changes — only the displayed copy is wrong.

## Worth deciding

At £199/mo, "Plans from £199/mo" next to competitors listed as "Free / $12" makes BookSuite look expensive at a glance. Two options once the numbers are corrected:

- Keep the comparison row as-is (honest, but unflattering without context).
- Add a short qualifier to that row, e.g. "£199/mo — includes payments, deposits and unlimited staff on higher tiers", so the price is read against what's included.

I'll apply the straight correction by default; tell me if you'd rather add the qualifier too.
