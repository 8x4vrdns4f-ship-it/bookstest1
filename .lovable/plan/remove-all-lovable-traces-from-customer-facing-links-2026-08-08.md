# Remove all Lovable traces from customer-facing links

## What's happening

Invite emails, booking links, and auth redirect links are all built from the URL of whatever page you happen to be on. When you add staff or send links from the editor preview, those links point at the Lovable preview domain — so your employee lands on a Lovable-branded page and is asked to sign up to Lovable instead of BookSuite.

## The fix

1. Add a single canonical public URL helper that always returns `https://booksuite.online` for anything that leaves the app (emails, invite links, shareable booking links, QR/kiosk links, auth redirect targets), with a localhost fallback only during local development.
2. Route every outbound link through it:
   - Employee invite link (`buildInviteUrl`)
   - Join page signup email redirect
   - Signup / verify-email / password-reset redirects
   - Public booking link, onboarding link, kiosk URL, embed snippet URL, join-request login link
3. Turn off the Lovable badge on the published site so no Lovable branding appears anywhere.

## Notes

- Auth redirect URLs must also be allow-listed for the live domain so confirmation links land back on booksuite.online.
- Nothing changes visually inside the app; only the URLs that get emailed or copied.

## Technical detail

New `src/lib/publicUrl.ts` exporting `PUBLIC_SITE_URL` and `publicUrl(path)`. Replace the `window.location.origin` usages in `src/lib/employeeInvite.ts`, `JoinInvite.tsx`, `Auth.tsx`, `VerifyEmail.tsx`, `Settings.tsx`, `Onboarding.tsx`, `BookingLinkCard.tsx`, `OnboardingChecklist.tsx`, `BookingsList.tsx`, `JoinCompanyDialog.tsx`, and `EmbedWidgetDialog.tsx`. Stripe `origin` payloads stay as-is (return URLs must match the active session origin).
