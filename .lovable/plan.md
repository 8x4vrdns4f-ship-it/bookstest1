# Launch readiness: BookSuite

## My honest score: **7 / 10**

You have a genuinely feature-complete product — most competitors at Series A don't ship this much. Bookings, deposits via Stripe Connect, resources/tables, waitlist, reviews with owner replies, employee roles + join requests, gift codes, subscription tiers with enforcement, embeddable widget, transactional email pipeline with suppression + unsubscribe, GSC-verified SEO, 38 languages. That's a 9/10 on **features**.

What holds the score at 7 is the stuff that separates "cool demo I built" from "product a stranger pays for on day one after a cold call": trust signals, onboarding friction, empty-state polish, and a few known reliability gaps you've hit yourself in the last 2 weeks (verify-email race, cancel-subscription for gift users, email delivery pause, signup form fields). Each was fixed — but the **pattern** says nobody has walked the whole flow end-to-end as a stranger recently. Cold traffic will find those cracks first.

Below is what needs to happen before you hit send on those hundreds of emails.

---

## Blockers (do before launch)

1. **Full stranger walkthrough, twice.** Sign up with a brand-new email, go through onboarding, connect Stripe, publish a widget, take a real £1 test booking on a different browser, cancel it, get the refund, get the review email, reply to the review. Do this on desktop AND mobile. Every friction point you hit, a cold prospect will hit at 10× the annoyance. Right now I don't believe anyone has done this recently.
2. **Legal pages actually filled in.** `Privacy.tsx` and `Terms.tsx` exist as routes — confirm they contain your real company name, address, contact email, data-processing terms, refund policy, cancellation policy. If they're template stubs, a UK company will not sign up. Also: cookie banner (you're targeting EU/UK, GDPR applies the moment your first customer is French or German).
3. **Pricing page must show what happens after the trial.** Confirm the pricing page states: card required? free trial length? what happens on day 15? Currency conversion for non-GBP visitors. If a prospect can't answer "what will I be charged" in 5 seconds, they close the tab.
4. **A real "About" / founder story page or section.** Cold-emailed businesses Google the founder before replying. If there's no face, no company registration, no address, they assume scam. Add one paragraph + a photo somewhere on the landing page.
5. **Support channel that actually reaches you.** A `mailto:` or in-app chat that lands in an inbox you check hourly during launch week. If a paying customer emails and gets silence for 24h, refund + churn + bad review.
6. **Error monitoring.** No mention of Sentry or similar. When 300 people hit the site in a day, something will throw. You need to know before they tell you.
7. **Rate-limit / abuse guard on public endpoints.** `join_waitlist`, `submit-review`, `save-pending-booking`, `embed-assistant` are all anon-callable. One bored person with curl fills your DB. Add per-IP throttling or a captcha on the widget submit and the waitlist RPC.

## Should-fix (launch week)

8. **Empty states everywhere.** New signup opens the dashboard and sees zero bookings, zero clients, zero reviews. Every empty-state card should have a clear "here's what to do first" CTA — not just blank space. `OnboardingChecklist.tsx` exists; make sure it's front and centre until 100% done.
9. **The 38-language claim needs to actually work on the widget flow.** Confirm client-facing strings (widget, booking success, cancellation, review email) are actually translated, not just the landing page. Otherwise the promise breaks the moment a French restaurant tries it.
10. **Uptime + backup story.** Cloud is on Supabase — good — but do you have a documented backup restore plan? What happens if the DB is corrupted at 2am? Even a one-page runbook.
11. **Analytics.** Plausible / PostHog / GA4 on the landing page, and product analytics on key dashboard actions (booking created, widget copied, first employee added). Without this you cannot tell which cold email converts, which page in the funnel loses people, or what the activation rate is.
12. **Public reviews / social proof.** `Testimonials.tsx` is on the landing page — confirm the testimonials are real people with real photos and real business names, or replace with "Be one of our first 20 businesses — 50% off for life" until you have real ones. Fake testimonials torch trust when spotted.
13. **Ownership / financial edit audit trail.** You have guard triggers on bookings/employees but no audit log. When a client disputes a refund next month, you'll want to see who did what and when.

## Nice-to-have (post-launch, first 30 days)

14. Onboarding video (60 seconds, screen recording).
15. Live chat widget (Crisp free tier).
16. Referral / affiliate code for the person cold-calling.
17. Public status page (status.booksuite.online).
18. Blog with the 3 guides you already wrote, plus 3 more targeting long-tail keywords ("how to take deposits for a hair salon", etc).
19. Comparison page vs Calendly / Setmore / SimplyBook — you already have `CompetitorComparison.tsx`, make it granular.

---

## What I'd do in the next 7 days if this were mine

1. **Day 1–2:** the stranger walkthrough. Fix everything you find. This alone will surface 5–10 issues.
2. **Day 3:** legal pages, About section, support email, Sentry.
3. **Day 4:** rate-limits on public endpoints, empty-state polish.
4. **Day 5:** analytics + one 60-second Loom.
5. **Day 6:** dry-run the cold-email flow with 10 friendly recipients first. Watch their screen if possible.
6. **Day 7:** fix whatever those 10 broke, then send the real hundreds.

---

## What I can do right now

Pick any of the above and I'll implement it. My recommended order:

- **A. Stranger walkthrough** — I run a Playwright end-to-end script as an unauthenticated visitor through signup → onboarding → widget → booking → cancel → review, capture every visible break, and produce a punchlist.
- **B. Legal + About + support** — I audit `Privacy.tsx` / `Terms.tsx`, ask you the ~8 facts I need (company name, address, ICO number, refund policy, etc.), and rewrite them properly.
- **C. Rate-limits + Sentry + error monitoring** — hardening pass on all public edge functions and add Sentry with a single free-tier DSN.
- **D. Empty-state + onboarding polish** — I go through every dashboard page with zero data and add proper first-run guidance.

Which one first?
