# Pre-launch performance & SEO polish

The SEO foundations scan is fully green (home page reachable, search + social metadata, sitemap, robots, favicon, AI-crawler readiness all passing). Every public page already has its own title, description and canonical. So this plan targets the real gaps, which are performance.

## 1. Shrink the oversized favicon

`public/favicon.png` is **719 KB** and loads on every single page. Compress it to a properly sized icon (a few KB). Biggest single win for first-visit load time.

## 2. Split the app so pages load faster

All ~45 pages (landing, dashboard, admin, portal) are bundled into one download — a first-time visitor on the landing page currently downloads the entire admin panel too.

- Keep the landing page and other public marketing pages loading instantly.
- Load the dashboard, admin panel, settings, employee and portal pages only when someone actually visits them (React lazy loading with a simple loading screen).
- Result: much smaller first download, faster landing page — the page new customers and Google judge you on.

## 3. Lazy-load landing page images

The dashboard/calendar screenshots below the fold load immediately even if the visitor never scrolls. Add lazy loading so they only load when scrolled into view.

## 4. Faster backend connection

Add a preconnect hint for the backend API origin so the first data request starts sooner.

## 5. Verify

- Re-run the SEO foundations scan to confirm everything stays green.
- Build check + a quick browser pass over the landing page and dashboard to confirm nothing visual changed and pages still load correctly.

## Out of scope

- Content/keyword strategy, new guides, or copy changes.
- SSR upgrade — not needed: Lovable already pre-renders pages for search engines and social crawlers (confirmed passing in the scan).

## Technical notes

- Favicon: resize `public/favicon.png` with sharp/magick to 192px and 32px PNGs, keep the same file references.
- Code splitting: `React.lazy` + `Suspense` in `src/App.tsx` for dashboard/*, admin/*, Settings, EmployeeDashboard, portal and other non-landing routes; add a minimal full-screen fallback spinner.
- Images: add `loading="lazy"` + `decoding="async"` to below-fold `<img>` tags in landing components; keep the hero image eager.
- Preconnect: `<link rel="preconnect">` for the Supabase origin in `index.html`.
