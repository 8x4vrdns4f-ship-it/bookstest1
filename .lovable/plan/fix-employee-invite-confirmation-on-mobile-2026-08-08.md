# Fix employee invite confirmation on mobile

## Goal
Make an employee invite complete in one reliable flow: open invite, create or sign into a BookSuite account, confirm the email if required, and join the correct company automatically without entering credentials again.

## Confirmed cause
- The invite currently stores the company identifier in a query parameter named `code`.
- Email confirmation also returns an authentication parameter named `code`, creating a collision.
- The confirmation redirects back to `/join`, but that page does not exchange the authentication code for a signed-in session before trying to claim the employee seat.
- The protected claim therefore runs without a valid user and incorrectly reports “Invite not found.”

## Implementation
1. **Separate invite and authentication parameters**
   - Rename the invite URL parameter from `code` to `company` while still accepting old invite links for compatibility.
   - Ensure the authentication callback parameter remains reserved for email confirmation.

2. **Preserve the invite through confirmation**
   - Store the intended `/join` destination before signup.
   - Send confirmation through the existing `/verify-email` callback, passing the full safe join destination as `next`.
   - Preserve the destination when a verification email is resent.

3. **Complete joining automatically**
   - After verification establishes the session, return to the original invite URL.
   - On `/join`, validate the signed-in email, claim the matching pending employee seat, and route directly to the correct employee or manager dashboard.
   - Do not show the signup/password form again once the confirmed matching account is available.

4. **Improve failure states**
   - Distinguish an expired confirmation link, an email mismatch, an already-claimed invite, and a genuinely missing invite instead of showing one misleading error.
   - Keep mismatched signed-in accounts safely signed out before claiming.

5. **Verify the complete flow**
   - Test new-account invite acceptance, existing-account acceptance, confirmation-link return, refreshed/deep-linked join URLs, and legacy `?code=` invite links.
   - Check mobile-sized rendering and confirm the final route and employee linkage.

## Technical scope
- Frontend invite URL generation and join/verification pages.
- Existing authenticated claim functions remain the security boundary; no weakening of permissions or email matching.
- A small regression test will cover invite URL parsing and destination preservation where practical.