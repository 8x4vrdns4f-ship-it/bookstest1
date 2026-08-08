# Replace the booking widget image on the landing page

## What changes

The "Booking widget" tab in the landing page product showcase currently shows an
auto-captured screenshot that looks poor. Once you upload your screenshot, it will
replace that one image. Nothing else on the landing page changes — same tab layout,
same card framing, same width.

## Steps

1. You send the screenshot in chat.
2. Save it into the project assets, replacing the current widget shot.
3. Keep the existing alt text and showcase layout untouched.
4. Check the landing page renders the new image correctly.

## Technical notes

- Target: `src/assets/shot-widget.jpg`, imported as `widgetShot` in
  `src/components/landing/ProductShowcase.tsx`.
- Only the asset file is swapped; the component's import, tab config, and the
  `max-w-sm mx-auto` wrapper for the widget tab stay as they are.
