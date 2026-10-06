# A new app icon, and tidy up the social links

## 1. Social links — nothing to change, one small tidy

The three links you sent are already the ones in the site footer, exactly as written:

- Instagram: instagram.com/booksuite.online — identical, already live.
- TikTok: tiktok.com/@booksuite — identical, already live.
- YouTube: youtube.com/@booksuite.online — already live. The link you sent has a long code stuck on the end (`?si=...`), which is just a tracking tag from the share button. I'll leave the clean version in place; it goes to the same channel.

So the only real work here is the icon.

## 2. A new app icon, designed for you

I'll design a square BookSuite mark that matches your wordmark — bold blue "B" and "S" monogram, on your dark navy background, sized and shaped properly (1024x1024, then cut down to the sizes each device wants).

I'll show you the design first and only swap it in once you say yes. If you don't like it, I'll do another round.

Why it's worth doing: the current icon is a detailed open-book-and-calendar picture. At the size a browser tab uses (16 pixels across) that detail turns to mush, and the file is taller than it is wide, so phone home screens crop it. Two bold letters stay readable at any size.

## 3. Where the icon gets used

One image, cut to the sizes each place needs, then pointed at everywhere the old one was used:

- Browser tab and bookmarks (small square).
- Saved to a phone home screen (apple-touch icon, 180x180).
- The web app manifest, so Android and desktop installs get 192 and 512 versions.
- Google search's site logo and the structured data on the guides pages, which both point at this same file.

The old icon file gets replaced, and the old Windows icon file gets rebuilt from the new design so nothing keeps serving the previous look.

## 4. After it's in

I'll load the site and check the tab, the saved-page appearance and the manifest entry actually show the new mark, and confirm nothing else on the site still points at the old picture.

## Technical notes

- Generate a 1024x1024 square mark (premium quality, since it carries letterforms), transparent or flat background, centred "BS" monogram in the accent blue on the dark navy surface token.
- Derive: `public/favicon.png` at 64x64, `public/apple-touch-icon.png` at 180x180, `public/icon-192.png` and `public/icon-512.png`, and a fresh `public/favicon.ico` containing 16/32/48 sizes.
- `index.html`: keep `/favicon.png` for `rel="icon"`, switch `apple-touch-icon` to the new dedicated file, keep `theme-color` as is.
- `public/site.webmanifest`: replace the single icon entry with the 192 and 512 entries, `purpose: "any maskable"` where suitable.
- No changes needed in `src/` for the icon: `src/components/Footer.tsx` socials already match the links you sent, so I'll only strip the YouTube tracking parameter if it were ever present there (it isn't).
- No database, auth, payment or booking changes.
