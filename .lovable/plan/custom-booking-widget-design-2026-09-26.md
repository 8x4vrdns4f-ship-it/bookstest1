# Custom booking widget design

Let logged-in business owners design their own booking widget (logo, colours, font, style), preview it live, press **Save**, and have every copy of the widget — the public booking page and any widget already embedded on their own website — show their design from then on. No need to re-copy the embed code.

## What the owner gets

A new **Widget design** section in Settings (replacing the current lone "Accent Color" field in Branding):

- **Logo** — upload an image (PNG/JPG/SVG/WebP, max 2 MB), shown at the top of the widget. Remove button.
- **Colours** — accent (buttons, selected dates/times), background, text colour. Colour picker + hex box each.
- **Theme presets** — one-click starters: Dark (current BookSuite look), Light, Warm, Forest, Mono. Picking one fills the colours, which they can then tweak.
- **Font** — choose from ~8 curated Google fonts (e.g. Plus Jakarta Sans, Inter, Poppins, Playfair Display, Lora, Montserrat, DM Sans, Space Grotesk).
- **Corner style** — Sharp / Rounded / Pill.
- **Live preview** — the real widget rendered next to the controls, updating as they change things.
- **Save** and **Reset to default** buttons. Unsaved changes are flagged.

Custom branding keeps the existing plan rule: free-tier owners see the controls locked with the current "Upgrade" prompt.

## How it reaches customers

The widget already fetches the business's settings when it opens. It will now also receive the saved design and apply it instantly (colours, font, logo, corners), so:
- the `/book/...` page, the embedded widget on owners' own sites, and the dashboard preview all update automatically after Save
- text contrast on buttons is picked automatically (dark or light) so a pale accent never makes labels unreadable

## Technical details

- Migration: add `widget_logo_url`, `widget_bg_color`, `widget_text_color`, `widget_font`, `widget_radius` to `business_settings` (reuse existing `accent_color`); validation trigger for hex colours, allowed fonts and radius values. Recreate `get_widget_settings` to return them.
- Storage: public `widget-logos` bucket; owners can only write to their own `{user_id}/` folder (RLS on `storage.objects`); public read.
- `src/lib/widgetTemplate.ts`: convert hardcoded colours in `WIDGET_STYLES` to CSS variables (`--bw-accent`, `--bw-bg`, `--bw-text`, derived muted/border tones, `--bw-radius`, `--bw-font`); after `get_widget_settings` loads, set the variables, inject the Google font link, and render the logo in the header. Accept an optional `previewTheme` so the Settings preview can render unsaved changes.
- New `src/components/dashboard/WidgetDesignCard.tsx` (controls + iframe preview + Save), wired into `Settings.tsx`; tier gate via `TIER_LIMITS[tier].customBranding`.
- Verify: save a design as the owner in the preview, open `/book/<id>` and confirm colours/font/logo apply; restore the account afterwards.
