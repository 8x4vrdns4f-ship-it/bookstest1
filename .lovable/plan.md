# Analytics & Owner Insights

Add a dedicated Insights page to the dashboard that turns bookings, payments, services, staff and reviews data into decisions the owner can act on.

## What the owner gets

A new **Insights** item in the dashboard sidebar (`/dashboard/insights`) with a date-range switcher (Last 7 days / 30 days / 90 days / This year) and:

**Headline cards** (with % change vs the previous equal period)
- Revenue taken (paid deposits + full payments)
- Bookings created
- Completion rate
- No-show / cancellation rate

**Trends**
- Bookings and revenue over time (line/area chart, grouped by day or week depending on range)
- Bookings by day of week and by hour — shows the busiest and deadest slots

**Breakdowns**
- Top services by bookings and by revenue
- Staff leaderboard: bookings handled, completion rate, average review rating
- Resources/tables utilisation (only shown when resources are enabled)
- New vs returning clients

**Insight callouts**
A short list of plain-English observations generated from the same data, e.g. "Tuesdays are your quietest day — 68% fewer bookings than Saturday", "3 no-shows this month, all unpaid bookings — consider requiring a deposit", "Haircut brings 41% of revenue".

Empty and low-data states: when a business has fewer than a handful of bookings, charts are replaced by a friendly "Not enough data yet" panel rather than misleading near-empty graphs.

Export: a "Download CSV" button for the bookings in the selected range.

## Technical notes

- New page `src/pages/dashboard/InsightsPage.tsx`, route in `App.tsx`, nav entry in `src/components/app/DashboardSidebar.tsx` (icon: `BarChart3`).
- Data is fetched client-side from existing tables via the Supabase client under current RLS — `bookings` (with `service_id`, `assigned_employee_id`, `resource_id`, `charge_amount`, `payment_status`, `status`), `services`, `employees`, `resources`, `reviews`, `clients`. No schema changes and no new edge functions.
- Aggregation happens in a `src/hooks/useInsights.ts` hook: one range query per entity, memoised reducers for the metric buckets, so switching ranges refetches once.
- Charts use the existing `recharts` setup and the `chart` UI primitives, styled with the app's semantic tokens (light-blue accent on dark) — no hardcoded colours.
- Reuses `SectionCard`, list skeletons, and the existing dashboard 20px-radius card styling so it matches the rest of the dashboard.
- Charts are lazy-loaded so the dashboard bundle does not grow for owners who never open Insights.
- Mobile: cards stack single-column, charts get horizontal scroll where needed.

## Out of scope for this step

Scheduled email digests of these insights, cross-business benchmarking, and forecast/prediction features.
