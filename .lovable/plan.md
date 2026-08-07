# Repricing: Silver £20, Gold £59, Platinum £199

## The new ladder

| | Silver | Gold | Platinum |
|---|---|---|---|
| Price | £20/mo | £59/mo | £199/mo |
| Bookings | 100/mo | 500/mo | Unlimited |
| Staff | 2 | 10 | Unlimited |
| Transaction fee | 12.5% | 5% | 2% |

Roughly 3x between tiers, so each upgrade feels affordable and nobody hits a hard wall. Silver's 2 staff seats cover a solo operator plus one helper. Existing feature splits (custom branding, advanced analytics, API access, priority support) stay exactly as they are.

## What changes

### 1. Stripe — the amounts customers are actually charged

Replace the amounts on the three existing recurring prices, keeping their IDs and lookup keys (`silver_monthly`, `gold_monthly`, `platinum_monthly`) so checkout keeps working with no edge function change:

- `silver_monthly`: £199 → £20
- `gold_monthly`: £549 → £59
- `platinum_monthly`: £1,195 → £199

After writing them I'll read the prices back from Stripe and confirm each lookup key resolves to the new amount in GBP, so what Stripe charges matches what the site shows.

Existing active subscriptions keep their old price until they change plan — Stripe never retroactively reprices. There are no live paying subscribers to migrate.

### 2. Plan limits

`src/lib/tierLimits.ts`:
- Silver: 50 → 100 bookings, 1 → 2 staff
- Gold: 300 → 500 bookings, staff stays 10
- Platinum: unchanged (unlimited)

These limits are enforced server-side by the existing database tier-limit triggers, so I'll update those caps to match in the same pass — otherwise the site would advertise 100 bookings while the database still blocks at 50.

### 3. Transaction fees

Gold drops 7.5% → 5% and Platinum 2.5% → 2%. This percentage is applied when a booking payment is taken, so it changes in both the fee constant used by the booking payment functions and the feature bullets on the pricing cards.

### 4. Site copy — also fixes the 100x display bug

Three places currently show prices 100x too small (written as if the stored figures were pence). Both problems get corrected together:

- `src/pages/Pricing.tsx` — tier amounts become 20 / 59 / 199, fee bullets become 12.5% / 5% / 2%.
- `src/components/TierComparison.tsx` — booking and staff limits updated to the new caps.
- `src/i18n/translations.ts` — the hero line and any tier limit strings become "Plans from £20/mo after the trial", with the Spanish, French, German and Italian versions matched.
- `src/pages/Index.tsx` — structured data becomes `lowPrice: 20`, `highPrice: 199` so Google indexes real figures.
- `src/components/landing/CompetitorComparison.tsx` — "Starts from" becomes £20/mo and "Per-booking fee" becomes "From 2%". At £20 this now reads competitively against "Free / $12" instead of undercutting your own credibility.

### 5. Verify

Load `/pricing` and the homepage and confirm all three tiers, limits, fees, hero line and comparison table show the new figures — then confirm the Stripe prices read back at 2000 / 5900 / 19900 pence.

## Technical notes

Stripe prices are Lovable-managed with lookup keys; repricing writes a new price against the same price ID, which takes over the lookup key. `create-checkout` resolves by lookup key, so no edge function changes are needed. Database tier caps live in the `enforce_*_tier_limit` trigger functions and need a migration to match the new booking/staff numbers.
