# Launch growth package

Everything from the growth review except the legal/business details and the in-person outreach (you're handling those yourself).

## 1. Website: turn visitors into sign-ups

- **Try-it-yourself booking demo** on the homepage: visitors book a pretend appointment on a sample barber page, like a real customer would. Nothing gets saved. Make sure to include a different service etc. so a barber name as a selection, and a haircut as another selection. Two seperate. So viewers can really see the capabilities. 
- **No-show cost calculator** (`/tools/no-show-calculator`): owners type in their average price and how many no-shows they get a week, and see how much money they lose each year, plus how much deposits would win back. Free tool that Google can find. Added to the sitemap and footer.
- **"Switching from Fresha / Treatwell / pen & paper?" section** on the homepage, showing three steps: import your client list, add your services, share your link.
- **Founding partner testimonials**: swap the made-up quotes for "Founding partner" cards, so it doesn't look like fake reviews. You can add real quotes later.
- **Video spot**: the empty video box stays where it is until you record a clip.

## 2. First-time setup: get the first booking faster

- Reorder the setup checklist on the dashboard so new owners follow 3 clear steps first: opening hours plus one service, connect payments, then copy their booking link.
- Show a **"Bring your clients over"** card in the first-time setup that opens the existing client list import.

## 3. Social media launch kit (in the Share kit)

- **Instagram story image generator**: one tap makes a phone-sized "Now taking bookings online" image with the business name and its QR code, ready to download.
- **Ready-made captions** for Instagram, TikTok and WhatsApp, with a copy button on each.

## Technical details

- Demo widget: a stand-alone component with local state only, no backend calls.
- Calculator: a new lazy-loaded page with SEO, JSON-LD (WebApplication), and an entry in `scripts/generate-sitemap.ts`.
- Story image: drawn in a browser canvas (1080x1920) with the existing `qrcode` package and design tokens.
- Checklist: reorder steps in `OnboardingChecklist.tsx` and add an import step that opens `ImportClientsDialog`.
- No changes to the database.