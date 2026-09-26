# Make the email claim true: honest wording, real sender identity, real replies

The FAQ promises emails sent from "your own verified sending domain". The verified domain is real (`notify.booksuite.online`, confirmed verified), but it belongs to BookSuite, and every email currently goes out as `BookSuite <noreply@booksuite.online>` with no reply-to at all. This makes the promise true in substance and honest in wording.

## 1. First: prove what the sending address can be

Before building the toggle, I run one test send with a custom sender name and a custom address on the verified domain, then read the delivery log. The result decides how far the "your own" option can honestly go:

- If a custom address on the verified domain is accepted, owners get a real choice of address.
- If it is refused, "your own" means: your business name as the sender, and replies landing in your own inbox — and the Settings wording says exactly that, with nothing implied.

Either way the sending address itself stays on a domain BookSuite has verified, because that is what keeps customer mail out of spam folders. Giving each business its own sending domain would need each of them to change their own DNS, which is not something we can set up for them.

## 2. Owner control: BookSuite identity or their own

A new choice in Settings, defaulting to BookSuite, so nothing changes for anyone until they opt in:

- **BookSuite (default)** — sender shows as "Business Name via BookSuite", replies go to BookSuite support.
- **Their own** — sender shows as just their business name, replies go straight to the business email they saved in Settings.

If no business email is saved, the option is shown as unavailable with a prompt to add one (only 3 of 11 accounts have one today). BookSuite branding stays inside the email in both modes.

The choice is remembered per business, so every email that business sends — confirmations, reminders, cancellations, review requests — uses it consistently, including emails triggered automatically by scheduled jobs.

## 3. BookSuite branding in every customer email

The "Powered by BookSuite" footer exists on booking confirmations and reminders only. I add the same subtle footer to the rest of the customer-facing emails: cancellations and declines, follow-ups, review requests, waitlist notices, rebooking reminders, campaigns, and the customer portal link. Owner-only and admin emails are unchanged.

## 4. Tell owners what their customers will see

- **Settings**: a short card showing a live preview of exactly what a customer sees — sender name, sending address, and where replies land — plus the toggle and a "send myself a sample" action so they can see it in a real inbox before launch.
- **Onboarding**: one line on the final step pointing to that card, so nobody finishes setup without knowing replies need their email saved.

## 5. Correct the wording where it overpromises

Rewritten to say what is actually true — emails are sent through BookSuite's verified, authenticated sending domain so they reach inboxes, and the owner's business name appears as the sender with replies going to their own inbox. Updated in: the landing-page FAQ, the same answer in all five languages (English, Spanish, French, German, Italian), and the booking-reminders guide.

## 6. Verify end to end

Deploy, then send a real sample of each mode and read the delivery log to confirm the sender name and reply-to are what the owner chose, with branding present. Repeat for an automatic reminder email, since those are triggered by a scheduled job rather than a person. Clean up any test data afterwards.

## Technical notes

- Migration adds one column to `business_settings`: `email_from_mode` (`'booksuite'` | `'own'`, default `'booksuite'`, checked). No new tables.
- New `_shared/sender-identity.ts`: loads the business's name, email and mode, returns the sender name, address and reply-to, with safe fallbacks when the row or email is missing.
- `_shared/transactional-email-templates/send-email.ts`: the send helper gains optional `fromName`, `fromAddress` and `replyTo`; defaults unchanged, and the verified sender-domain constants are untouched.
- `app-email`: accepts an optional business id, resolves the sender identity, and passes it through. An authenticated caller may only set their own business id; scheduled jobs use the trusted backend key. Owner-facing and platform templates always use the BookSuite identity.
- Client-facing templates get `PoweredByFooter` with the existing source-tracking prop.
- Settings card reuses existing cards, inputs and tokens; onboarding gets one added line.
- Deploy `app-email`, `preview-transactional-email` and every function that sends a customer-facing template, since templates are bundled into each function at deploy time.
