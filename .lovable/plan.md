## Plan: make the owner Stripe Connect button work reliably

### What I found
- The dashboard `Connect Stripe` button is wired to the right backend function.
- The return/refresh pages still call payment functions without explicitly attaching the logged-in session token, so even if onboarding starts, returning from Stripe can fail silently.
- The current UI only shows a generic error, so you can’t tell whether the issue is login/session, backend auth, missing Stripe setup, or a Stripe account creation error.
- Recent backend logs show no successful function hits from the preview, which means we should also verify the functions are deployed and callable after the code patch.

### Fixes to implement
1. **Centralise Connect auth headers**
   - Add a small helper for calling protected backend payment functions with the current logged-in user token.
   - Use it from:
     - `PaymentsCard`
     - `PaymentsReturn`
     - `PaymentsRefresh`

2. **Fix Stripe return and refresh flow**
   - When Stripe sends the owner back to `/payments/return`, call `connect-account-status` with auth so the app can update connected/onboarding status.
   - When Stripe sends the owner to `/payments/refresh`, call `connect-create-account` with auth so a fresh Stripe onboarding link is generated.

3. **Improve error visibility**
   - Replace generic “Could not start onboarding” messages with the real backend error where safe.
   - Add clear messages like:
     - “Please log in again to connect Stripe.”
     - “Stripe onboarding could not be started.”
     - “Stripe returned no onboarding link.”

4. **Validate backend functions**
   - Deploy/check the three Connect functions:
     - `connect-create-account`
     - `connect-account-status`
     - `connect-dashboard-link`
   - Call `connect-account-status` against the live backend to confirm authenticated calls work.
   - Check function logs again after testing.

5. **If Stripe itself still rejects the call**
   - Inspect the exact backend error from `connect-create-account`.
   - Patch only that cause, likely one of:
     - wrong live/sandbox environment selection
     - missing/invalid Stripe connector key
     - connected account country/capability mismatch
     - Connect platform settings not fully active

### Expected result
- A company owner clicks **Connect Stripe**.
- The app creates or reuses their connected Stripe account.
- The owner is redirected to Stripe onboarding.
- Returning from Stripe updates the dashboard status instead of showing a generic error.