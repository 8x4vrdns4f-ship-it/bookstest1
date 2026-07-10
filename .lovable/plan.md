Restyle the embeddable booking widget so it looks noticeably cleaner and more professional, while keeping the current single-screen structure (day chips → time slots → duration → details → card → submit). No flow changes, no dropdowns.

All changes live in `src/lib/widgetTemplate.ts` (the self-contained HTML/CSS/JS used by `/embed/:userId`, the script-tag embed, and the downloadable HTML). Zero backend changes.

## Visual direction

Refined dark UI, aligned with the BookSuite app aesthetic:
- Background: deep near-black card (`#0F1420`) with a subtle 1px border (`#1F2937`) and softer shadow — currently a mid-blue-grey card with a heavy shadow.
- Accent: keep the BookSuite light blue (`#5BADE8`) but use it more sparingly — only on the selected state and the primary CTA.
- Typography: switch the widget to Plus Jakarta Sans (loaded from Google Fonts inside the widget HTML so it works standalone), with a clear scale: 20px title, 11px uppercase section labels with more letter-spacing, 13px body.
- Rounded corners bumped from 6–8px to 10–12px for pills/inputs, 20px for the outer card.
- Consistent 16px internal padding rhythm; more breathing room between sections.

## Component-level changes

1. **Header block**
   - Title left-aligned, subtitle in muted grey underneath.
   - Deposit line becomes a small inline pill (rounded, subtle border, no full-width bar) sitting next to the subtitle instead of a separate boxed row.

2. **Day chips**
   - Larger tap targets (min 64px wide, 68px tall), 12px radius.
   - Unselected: transparent background with a 1px border; hover fills subtly.
   - Selected: solid accent with black text (current behavior, cleaner border).
   - Closed days rendered muted/disabled with a diagonal-line feel via opacity + strikethrough on the day number, not the current red "busy" style.
   - Scroll row gets fade-out gradients on left/right edges so it clearly indicates more days.

3. **Time slots**
   - 3 columns on mobile / 4 on wider widget (currently always 4).
   - Pill style: taller (36px), 10px radius, monospaced-feeling tabular numbers so "09:30" and "10:00" line up.
   - Busy slots: muted grey with a thin strike, no red — red reads as an error.
   - Selected slot uses the accent fill.
   - Empty state ("Pick a day first") gets a proper centered muted message with an icon glyph.

4. **Duration**
   - Row of 4 equal pills matching the time-slot style for visual consistency.
   - Disabled state uses reduced opacity + `cursor: not-allowed` without changing size.

5. **Your details**
   - Inputs get a floating-label look: label sits inside the input, 12px placeholder, focus ring in accent.
   - Two-column on wide, single-column under 380px.

6. **Card details**
   - Stripe Elements appearance tuned to match: `borderRadius: 10`, `colorBackground: #0F1420`, `colorText: #F3F4F6`, matching input border color, slightly larger `fontSizeBase`.
   - Payment note becomes a small lock-icon + text row so it reads as reassurance, not a disclaimer.

7. **Submit button**
   - Full-width, 48px tall, 12px radius, accent background, subtle hover lift (translateY -1px, stronger shadow).
   - Disabled state: 40% opacity, no pointer.

8. **Success state**
   - Larger check in a circular accent-tinted background, tighter copy, primary "Book another" ghost button underneath (client-side reset — no backend call).

9. **Error banner**
   - Softer red (`#2A1518` bg, `#FCA5A5` text), left accent bar, no full block color.

## Technical notes

- All work in `WIDGET_STYLES` and `WIDGET_MARKUP` constants, plus the Stripe `appearance` block inside `buildWidgetScript`.
- Add a `<link rel="preconnect">` + Google Fonts `<link>` for Plus Jakarta Sans in `buildWidgetHtml`'s `<head>`, with `-apple-system` fallback so first paint is never blocked.
- Keep the widget viewport-safe: max-width stays 460px, all sizing in `rem`/`px` (no viewport units) so it looks identical inside the 500px iframe on any host site.
- Preserve every existing DOM id (`bw-dates`, `bw-slots`, `bw-durs`, `bw-name`, `bw-email`, `bw-payel`, `bw-err`, `bw-submit`, `bw`, `bw-done`) so the JS logic is untouched.
- No changes to `src/pages/EmbedWidget.tsx`, `public/embed.js`, edge functions, or Stripe wiring.

## Out of scope

- No stepped/multi-screen flow.
- No dropdowns.
- No calendar month grid.
- No copy changes to the landing page or dashboard preview surrounding the widget.
