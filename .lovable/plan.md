## Plan

### 1. Social links (Footer)
- YouTube → `https://youtube.com/@booksuite.online`
- TikTok → `https://www.tiktok.com/@booksuite`
- Instagram stays as already wired
- Any other icons currently in the footer with no URL get hidden until you send the rest

### 2. Landing page expansion
Keep the current hero, feature cards, emoji strip, and pricing table. Insert new sections in this order:

1. **Stronger hero copy** — sharper headline, supporting subheading, and a one-paragraph "what BookSuite is" blurb under the existing hero CTAs. No layout change.
2. **How It Works** — 4 numbered steps:
   1. Sign up (free)
   2. Set your services, staff, and hours
   3. Share your booking link / embed the widget
   4. Get paid — we handle confirmations, reminders, and payouts
3. **Expanded Features** — deeper cards/sections covering:
   - Calendar + 30-min slot scheduling
   - Embeddable booking widget for any site
   - Staff management, shifts, and "on shift now"
   - Gift codes & subscriptions
   - Automated transactional emails (booking confirmations, reminders, receipts)
   - Stripe-powered payments
4. **Testimonials** — 3 quote cards with placeholder names/roles (clearly swappable later)
5. **FAQ** — 6–8 questions: pricing, transaction fees, cancellation, who it's for, embedding the widget, payouts, email deliverability, support contact
6. **Final CTA band** — full-width section above the footer: headline + "Try Now" button + secondary "Login"

### 3. Style
Matches existing design system — dark theme, light blue accent, Plus Jakarta Sans, BookSuite logo styling. No new colors or fonts introduced. Sections use existing card/border tokens for consistency.

### Technical notes
- Edit `src/components/Footer.tsx` to add TikTok + YouTube hrefs.
- Edit the landing page (likely `src/pages/Index.tsx` or `Landing.tsx`) to insert new sections between existing ones.
- Create small section components under `src/components/landing/` (`HowItWorks.tsx`, `ExpandedFeatures.tsx`, `Testimonials.tsx`, `FAQ.tsx`, `FinalCTA.tsx`) to keep the page file readable.
- FAQ uses existing shadcn `Accordion`.
- No backend, schema, or auth changes.

### Out of scope (call out)
- Real testimonial content — placeholders for now
- The `help@booksuite.online` mailbox decision (still waiting on your provider pick)
- Remaining social URLs (Facebook, X, etc.) — will stay hidden until you send them
