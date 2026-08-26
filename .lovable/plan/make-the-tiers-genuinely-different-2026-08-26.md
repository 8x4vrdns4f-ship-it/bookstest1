# Make the tiers genuinely different

Right now the only real differences are booking/staff caps, transaction fee, custom branding and "advanced analytics". Everything else BookSuite can do — reviews, waitlist, resources, gift codes, embed widget, day/rental mode, employee app, API — is available on every plan, so Gold and Platinum don't feel worth the jump. This plan gates real, already-built capability behind the ladder.

Prices stay £20 / £59 / £199. Nothing existing is removed from a customer mid-subscription without them seeing it on the pricing page first.

## Proposed ladder

| | Silver £20 | Gold £59 | Platinum £199 |
|---|---|---|---|
| Bookings / month | 100 | 500 | Unlimited |
| Staff seats | 2 | 10 | Unlimited |
| Services | 5 | Unlimited | Unlimited |
| Bookable resources (tables, rooms, vehicles) | — | 10 | Unlimited |
| Transaction fee | 12.5% | 5% | 2% |
| Booking page + embeddable widget | Yes | Yes | Yes |
| Email reminders | Yes | Yes | Yes |
| SMS reminders | — | Yes | Yes |
| Reviews collection + public rating | — | Yes | Yes |
| Reply to reviews | — | Yes | Yes |
| Waitlist for full slots | — | Yes | Yes |
| Custom branding (logo, colours, own domain link) | — | Yes | Yes |
| Remove "Powered by BookSuite" | — | — | Yes |
| Analytics | Basic totals | Full insights + charts | Insights + CSV export + staff performance |
| Employee mobile app (shifts, time off) | View only | Full | Full |
| Day / rental booking mode | — | Yes | Yes |
| Gift codes | — | — | Yes |
| API + MCP access | — | — | Yes |
| Data retention | 6 months | 2 years | Unlimited |
| Support | Email | 24h priority | 1h priority |

Rationale: Silver is a solo operator taking appointments. Gold is the real product for a small team — it unlocks everything that wins repeat customers (reviews, SMS, waitlist, branding). Platinum is for multi-site / high volume: no fees to speak of, no caps, integrations and data ownership.

## How it gets enforced

Every gate is defined once in `src/lib/tierLimits.ts` and mirrored server-side, so the UI and the database never disagree.

1. **Extend the tier config** — add `services`, `resources`, `smsReminders`, `reviews`, `waitlist`, `giftCodes`, `dayMode`, `csvExport`, `removeBranding`, `retentionMonths` to `TIER_LIMITS`.
2. **Client gating** — wrap the locked areas in the existing `LockedFeature` component (Reviews page, Waitlist card, Resources manager, Gift codes card, SMS toggle in Settings, day-mode toggle, CSV export button). Each shows the blurred preview plus "Upgrade to Gold/Platinum", which is a far better sell than hiding the feature.
3. **Server enforcement** — extend the existing `enforce_*_tier_limit` trigger pattern to cover services and resources counts, and check tier inside the review-request, waitlist-notify and SMS paths so a locked feature can't be driven by direct API calls.
4. **Public widget** — the widget only offers the waitlist and resource picker when the owner's tier allows it; the "Powered by BookSuite" line only disappears on Platinum.
5. **Pricing surfaces** — rewrite the feature bullets on `src/pages/Pricing.tsx`, the rows in `src/components/TierComparison.tsx`, and the matching strings in `src/i18n/translations.ts` so what's sold matches what's enforced.
6. **Upgrade nudges** — `UsageBanner` already warns near the booking cap; extend it to also surface the single most valuable locked feature for the current tier.

## Existing customers

Anyone already subscribed keeps their tier; the new gates apply immediately on Silver, which today has access to reviews and waitlist. If you'd rather not take anything away from current Silver accounts, I can grandfather them with a flag so only new signups see the tighter Silver — say the word and I'll add it.

## Technical notes

Tier caps live in `src/lib/tierLimits.ts` (client) and the `enforce_*_tier_limit` trigger functions plus `tier_fee_percent()` (database); fees also mirror in `supabase/functions/_shared/tier-fees.ts`. A single migration adds the new count triggers and a `tier_allows(feature)` SQL helper backed by the existing `get_active_tier` logic, used by the edge functions so no new privilege surface is introduced. Retention hooks into the existing `apply-retention` function, which currently uses one fixed window.
