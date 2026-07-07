
# Ranking BookSuite higher on Google

Honest framing first: Google ranking is earned over weeks/months through relevance, authority, and content — not a switch we flip. But there's a lot we can do in-app right now to give BookSuite the best possible foundation. Here's the plan.

## 1. Verify & submit to Google Search Console
- Add BookSuite to Google Search Console (via meta-tag verification in `index.html`).
- Submit `sitemap.xml` so Google discovers every page.
- Request indexing on the homepage and pricing page to speed up first crawl.

This is the #1 missing piece — without it, we're guessing what Google sees.

## 2. Per-page SEO metadata (title, description, canonical, OG)
Currently only Index uses `<SEO>`. Add it to every public route with unique, keyword-focused titles/descriptions:
- `/pricing` — "BookSuite Pricing — Plans for Small Service Businesses"
- `/auth` — noIndex (not useful in search)
- `/privacy`, `/terms`, `/security` — proper titles, low priority
- Public booking pages — noIndex (per-tenant, not for search)

## 3. Structured data (JSON-LD)
Add rich schema so Google can show enhanced results:
- **SoftwareApplication** schema on homepage (name, category, pricing, rating placeholder)
- **FAQPage** schema on the landing FAQ section (already have Q&A content — just needs markup)
- **BreadcrumbList** on inner pages
- **Product** schema on pricing tiers

FAQ rich results in particular can dramatically expand search real estate.

## 4. Content & keyword targeting
The current landing copy is generic. To rank for terms people actually search:
- Target primary keywords: "booking software for small business", "appointment booking system", "salon booking software", etc.
- Rework H1/H2s and hero copy to include these naturally
- Add a `/features` page (deep, keyword-rich, ~800+ words)
- Add a `/blog` or `/guides` section — this is the single biggest long-term ranking lever. Even 3–5 high-quality posts ("How to take deposits for appointments", "Best booking software for barbers", etc.) can pull real traffic.

I can also run Semrush keyword research to pick the exact terms with best volume-vs-difficulty tradeoff for BookSuite's niche.

## 5. Technical SEO hygiene
- Confirm `robots.txt` and `sitemap.xml` are correct (they are, but sitemap should auto-generate from routes so new pages get added).
- Convert sitemap to a generated script (`scripts/generate-sitemap.ts`) that runs on build.
- Add `lastmod` dates to sitemap entries.
- Verify all images have descriptive `alt` text.
- Verify single H1 per page, semantic heading hierarchy.

## 6. Performance & Core Web Vitals
Google factors page speed. Check:
- Image sizes (hero, OG image)
- Lazy-loading below-the-fold images
- Font loading strategy

## 7. Off-page (what only you can do)
- **Backlinks** are the biggest external ranking factor. List BookSuite on: Product Hunt, G2, Capterra, SaaSHub, AlternativeTo, small-business directories.
- Get customers to link to their public booking page from their own sites — every one is a backlink.
- Google Business Profile if there's a physical/regional angle.

## Suggested order of execution
Fastest wins first:
1. Search Console verification + sitemap submission (immediate, foundational)
2. Per-page SEO metadata + FAQ/Software JSON-LD (1 build, big impact for rich results)
3. Semrush keyword research → rewrite hero + add /features page
4. Auto-generated sitemap with lastmod
5. Blog/guides infrastructure (biggest long-term lever)
6. Off-page work (your side, ongoing)

## What I need from you
- **Confirm scope**: do you want all of the above, or should we start with steps 1–3 and see results before doing content work?
- **Blog?**: are you willing to publish articles regularly? If yes, I'll scaffold the blog. If not, we'll skip it (biggest single miss, but only worth building if you'll use it).
- **Keywords**: want me to run Semrush research to pick target terms, or do you already know which searches you want to rank for?
