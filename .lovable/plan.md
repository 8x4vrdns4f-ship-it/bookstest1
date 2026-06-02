## Goal

Make it trivial for a business owner to put the booking widget on their own site — no downloading, no editing HTML, no developer required.

## The better approach: hosted embed script

Instead of downloading a self-contained `.html` file, give each owner a **one-line `<script>` snippet** they paste into their site (Wix, Squarespace, Shopify, WordPress, plain HTML — all support a custom HTML block). The script auto-renders the widget inside whatever container they drop it into.

```html
<div id="booksuite-widget"></div>
<script src="https://booksuite.online/embed.js" data-user="USER_ID"></script>
```

Behind the scenes `embed.js` is the same widget code we already generate, served from a stable URL. Owners never see the source. We can also ship updates/bug fixes without anyone having to re-download.

## What changes for the owner

Replace the "Download Calendar Widget" button with an **"Embed Widget"** button that opens a dialog containing:

1. **Tabs for install method**
   - **Universal `<script>` snippet** (default) — copy button, works anywhere that accepts custom HTML
   - **iframe snippet** — `<iframe src="https://booksuite.online/embed/USER_ID" …>` for platforms that block scripts (some Squarespace/Wix free tiers)
   - **Direct link** — `https://booksuite.online/book/USER_ID` they can put behind any "Book Now" button or share on Instagram/WhatsApp
   - **Download HTML** — keep the existing option as a fallback for advanced users

2. **Platform guides** — short collapsible "How to add this to…" sections for Wix, Squarespace, Shopify, WordPress, Webflow, plain HTML (3–5 steps each, with screenshots later).

3. **Live preview** of the widget inside the dialog so they see exactly what their customers will see.

## Technical sketch

```text
src/pages/EmbedScript.tsx     -> serves the JS at /embed.js (querystring user id)
src/pages/EmbedFrame.tsx      -> /embed/:userId -> renders widget standalone
src/pages/PublicBooking.tsx   -> /book/:userId -> branded full-page booking link
src/components/dashboard/EmbedWidgetDialog.tsx -> tabs + copy buttons + preview
```

- `embed.js` is generated from the existing `buildWidgetHtml` logic, refactored so the JS body lives in one place and is reused by all three surfaces (script tag, iframe page, public page).
- Script-tag mode: finds `<div id="booksuite-widget">` (or the script's parent) and injects the widget HTML + styles scoped under `.bw`.
- iframe + `/book/:id` mode: reuses the same renderer inside a React page.
- No backend changes needed — widget already talks to Supabase RPCs with the anon key.

## Dashboard change

Swap the current `Download Calendar Widget` button for `Embed Widget`, opening the new dialog. Keep download as one tab inside so nothing regresses.

## Out of scope (for now)

- Custom theming per-business (colors/fonts) — can be a follow-up.
- Analytics on embed loads.
- npm package / React component version.

Want me to build this?