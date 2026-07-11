Same treatment as the widget: keep the dark theme, blue accent, Plus Jakarta Sans and the current structure — no redesign, no new palette, no layout changes. Every page and every shared surface gets tuned so the app feels one grade sharper and more professional.

## Shared surfaces (touch once, everything benefits)

- **`SectionCard`** — tighten padding rhythm (20/24), header gap, remove `hover:shadow` lift (feels twitchy on static cards), stronger border contrast (`border`/`border-border/70`), 20px radius to match widget, refined title (15px/600) + description (13px/muted) hierarchy.
- **`StatCard`** — bigger, more confident value (32px, tabular-nums, tighter tracking), label as 11px uppercase muted with wider letter-spacing, icon chip 36×36 with softer bg (`bg-primary/8`), 20px radius, remove hover lift, keep hover border tint only. Trend pill smaller and rounder.
- **`PageHeader`** — tighter vertical rhythm, slightly larger title, description one tone lighter, action row spacing normalised, subtle divider under header on scroll (optional, sticky-safe).
- **`DashboardSidebar`** — active item: solid subtle accent bg + accent text (matches widget selection). Nav item height 36px, icon 18px, tighter label letter-spacing. Group labels smaller (10px) and more muted. Slightly stronger border on the right edge.
- **`DashboardHeader`** — align height with sidebar header (56px), refined trigger button, avatar/menu tightened.
- **Dialogs (`AppDialog`)** — 20px radius, denser header, `max-w` normalised per size, softer overlay, consistent footer button row.
- **Empty states (`EmptyState`)** — circular tinted icon (like widget success), 15px title, 13px muted body, single primary CTA.
- **Buttons** — audit primary/secondary/ghost sizing across dashboard, ensure 40/44px heights, consistent 10–12px radius, subtle hover (bg shift, no translate).
- **Tables/lists** — row height, divider colour, hover tint, header uppercase 11px muted — applied to `BookingsList`, `ClientList`, `StaffList`.

## Per-page passes

- **Overview (`Dashboard.tsx`)** — restyled stat grid, tighter chart card, onboarding checklist as clean numbered rows (not chunky cards), booking requests + join requests + gift codes rendered through the polished `SectionCard`. `UsageBanner` softened, `SubscriptionWidget` compacted.
- **Bookings page** — filter bar tightened, list rows given the shared row style, status pills restyled (dot + small caps), detail dialog refreshed via `AppDialog` polish.
- **Calendar page** — day/time chips restyled to match widget (transparent bordered → solid accent when selected), today marker refined, `DayScheduleDialog` cleaned up.
- **Clients / Staff / Shifts / Reviews** — inherit shared row + card + empty-state polish. Small per-page tweaks only where visibly off (spacing, badge colour, header alignment).

## Design tokens (index.css)

- Slight tune to `--shadow-sm` / `--shadow-md` so cards feel flatter and calmer (less generic glow).
- Add helper `.stat-value` / `.stat-label` if not already there, matching the new sizing.
- No colour, font, or radius scale changes beyond what tokens already expose. No new dependencies.

## Out of scope

- No logic changes, no data-fetching changes, no route changes.
- No new features, no new sections, no landing-page work, no widget changes.
- No dark→light or palette swap. No typography swap.

## Verification

After the pass: load `/dashboard`, `/dashboard/bookings`, `/dashboard/calendar`, `/dashboard/clients`, `/dashboard/staff`, `/dashboard/shifts`, `/dashboard/reviews`, plus a booking detail dialog and the embed widget dialog — visually confirm consistent spacing, card style, and typography with a Playwright screenshot per page.
