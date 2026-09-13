# Final polish before launch

A pass over the small things that aren't yet at their best. None of these change how the product works — they make it feel finished and stop rare situations turning into a blank screen.

## 1. Nothing catches a crash

If any page hits an unexpected error, the visitor gets a blank white screen with no way out. Add a friendly error screen ("Something went wrong" + Reload + Back to home) that wraps the whole app, plus the same safety net around the signed-in dashboard so an error in one panel doesn't take the whole page down.

## 2. Stale-version blank screen

After a new version is published, someone with the old page still open can click through and get a blank screen because the old file no longer exists. Detect that specific failure and reload the page automatically once.

## 3. The 404 page looks unfinished

It's a bare grey box with "Oops! Page not found" and a plain blue link — no logo, no header or footer, off-brand. Rebuild it with the normal header/footer, BookSuite styling, and useful links (Home, Pricing, Contact).

## 4. Small polish on the page setup

- Add an apple-touch icon and a browser theme colour so the site looks right when saved to a phone home screen.
- Add a web app manifest with the BookSuite name and icon.

## 5. Slow-connection feel

The loading spinner between pages shows instantly even on fast connections, which reads as a flicker. Delay it slightly so quick page changes feel instant.

## 6. Second domain isn't live

`www.booksuite.online` is registered but shows as drifted, so anyone typing "www." may not reach the site. I'll check its status and report exactly what DNS record you need to fix at your registrar (I can't change registrar settings myself).

## 7. Still open, needs you

Privacy, Terms and About still say "[TO BE ADDED]" for registered company name, company number and address. Send those over and I'll drop them in — this is the one genuine launch blocker left.

## Technical notes

- New `src/components/ErrorBoundary.tsx` (class component with reset), wrapping `<App>` inner tree and `AppLayout`'s `<Outlet />`.
- Chunk-load recovery: catch `Failed to fetch dynamically imported module` in the boundary and `window.location.reload()` once, guarded by a `sessionStorage` flag.
- Rewrite `src/pages/NotFound.tsx` using `Navbar`/`Footer`, keep `SEO` with `noIndex`, drop the `console.error`.
- `index.html`: `apple-touch-icon`, `theme-color`, `link rel="manifest"`; add `public/site.webmanifest`.
- `PageFallback` in `src/App.tsx`: render spinner after ~200ms via a small delayed-show component.
- Domain: read-only status check, report required DNS record.

No database, auth, payment or booking logic changes.
