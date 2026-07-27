## Real product screenshots for the homepage

Replace the placeholder images in `ProductShowcase` (Dashboard / Calendar / Booking widget) with polished captures of the live app.

### Steps

1. **Capture raw screenshots via Playwright against `http://localhost:8080`**
   - Restore the managed Supabase session (Dashboard + Calendar are auth-gated) and navigate to:
     - `/dashboard` — capture at 1600×1000
     - `/dashboard/calendar` — capture at 1600×1000
     - A public booking widget URL — capture at ~912×1200 (mobile-ish frame)
   - Save PNGs to `/tmp/browser/shots/`.
   - If auth isn't `injected` for this project, fall back to capturing only the widget and keep the current placeholder art for Dashboard/Calendar rather than shipping broken images. Report what was captured.

2. **Frame each shot with the product-shot skill**
   - Copy `knowledge://skill/product-shot/generate.py` → `/tmp/generate.py`.
   - Run it per shot with a preset that fits the dark theme (`midnight` for Dashboard/Calendar, `ocean` for the widget) to produce macOS-window framed PNGs into `/mnt/documents/`.

3. **Publish images as CDN assets**
   - Convert each framed PNG to JPG (smaller) and upload via `lovable-assets create` to produce `src/assets/shot-dashboard.jpg.asset.json`, `src/assets/shot-calendar.jpg.asset.json`, `src/assets/shot-widget.jpg.asset.json`.
   - Delete the current local `src/assets/shot-*.jpg` placeholders after the pointers are in place.

4. **Wire the new assets into `ProductShowcase.tsx`**
   - Switch imports from the raw JPGs to the `.asset.json` pointers and reference `.url`.
   - Update the `w`/`h` values to the actual framed dimensions so CLS stays at zero.
   - Since the product-shot frame already provides a macOS window, drop the inner `BrowserFrame` chrome for these tabs to avoid a double frame (keep the section container/shadow).

5. **Verify**
   - Load the homepage in Playwright, screenshot the ProductShowcase section on all three tabs, and confirm the new imagery renders crisply with no layout shift.

### Technical notes

- No routing, schema, or copy changes.
- Only touches `src/components/landing/ProductShowcase.tsx` and files under `src/assets/`.
- If auth injection is unavailable, I'll pause after Step 1 and ask you to sign in via the preview so I can re-capture the authenticated views — rather than shipping empty-state screenshots.
