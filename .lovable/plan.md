# Fix Google "Missing field image" warning

## What Google is saying
Some pages tell Google "this is a product / article" but don't include a picture. Google requires a picture for those, so they can't show as rich results (the fancier listings with price, stars, etc.). It's a warning about extra features, not about whether the pages are found.

## The fix
Add a picture to every page description Google reads that is missing one:
- Pricing page (described as a product with Silver/Gold/Platinum prices) — main culprit.
- Homepage and the 13 industry pages (described as software).
- Guide articles.
- Free no-show calculator.

The picture used will be the existing BookSuite share image (the same one shown when the site is shared on social media), with the logo as a backup.

## After it's done
1. Publish the update.
2. In Google Search Console, on the screen in your screenshot, press **Validate fix**. Google rechecks over a few days and the warning clears.

## Technical details
- Add `image: [<absolute og-image URL>, "https://booksuite.online/icon-512.png"]` to the JSON-LD in `src/pages/Pricing.tsx` (Product), `src/pages/Index.tsx` and `src/pages/NicheLanding.tsx` (SoftwareApplication), `src/pages/GuideDetail.tsx` (Article), `src/pages/NoShowCalculator.tsx` (WebApplication).
- Build absolute URL from `https://booksuite.online` + the og-image asset pointer's `url`; define it once in a shared constant.
- Verify via Playwright that each page's JSON-LD contains `image`.
