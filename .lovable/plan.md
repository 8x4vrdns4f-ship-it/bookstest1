# Replace the booking widget image on the landing page

## What changes

The "Booking widget" tab in the landing page product showcase currently shows an
auto-captured screenshot that looks poor. Your uploaded screenshot (the Parlourbarber
booking card) replaces it. Nothing else changes — same tab layout, same card framing,
same width.

## Steps

1. Add the uploaded screenshot to the project as the new widget image.
2. Point the "Booking widget" tab at it, replacing the old shot.
3. Keep the existing alt text and showcase layout untouched.
4. Check the landing page renders the new image correctly.

## Technical notes

- Current asset: `src/assets/shot-widget.jpg`, imported as `widgetShot` in
  `src/components/landing/ProductShowcase.tsx`.
- The upload becomes a CDN asset pointer (`lovable-assets create` from
  `/mnt/user-uploads/IMG_0741.jpeg`); the component imports the pointer and uses its
  URL. The old `shot-widget.jpg` is removed.
- Tab config and the `max-w-sm mx-auto` wrapper for the widget tab stay as they are.
