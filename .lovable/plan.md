## Email verification before dashboard (Option C)

After signup, users see a "Check your email" page. Clicking the verification link in the email automatically logs them in and drops them straight on the dashboard — no need to re-enter their password. Unverified users cannot reach the dashboard.

### What changes for the user

**Signup flow:**
1. Click "Try Now" → fill signup form → click Sign Up
2. Land on a friendly "Check your email" page showing their email address, a "Resend email" button (with 60s cooldown), and a "Wrong email? Sign out" link
3. Open the email → click the verification button
4. Land directly on the dashboard, already logged in ✓
5. From the dashboard they can pick a plan and pay (existing flow unchanged)

**Login flow:**
- Verified users log in normally → dashboard
- If an unverified user logs in, they're sent to the "Check your email" page instead, with the Resend button ready

**Employee join flow:**
- Same pattern — employees must verify their email before a manager can approve them. Keeps junk accounts out.

### Technical changes

1. **Auth settings:** turn off auto-confirm so the verification email is actually required.

2. **New page `/verify-email`** (public route):
   - Shows the email address, "Resend verification email" button with cooldown, and "Sign out and use a different email" link
   - Polls every few seconds — as soon as `email_confirmed_at` is set, forwards to the right dashboard via existing `getDashboardRoute()`
   - Also the landing page Supabase redirects to after the user clicks the link, so verification → auto-login → dashboard happens seamlessly

3. **`Auth.tsx`:**
   - After signup, navigate to `/verify-email` instead of flipping to login mode
   - On login, if `email_confirmed_at` is null, route to `/verify-email`
   - Set `emailRedirectTo: ${origin}/verify-email` on signup

4. **Dashboard guards:** extend `RequireSubscription` (or add a small `RequireVerifiedEmail` wrapper) so any signed-in user with an unverified email is redirected to `/verify-email`. Applies to `/dashboard`, `/employee-dashboard`, `/settings`, `/payments`.

5. **Routing:** add `/verify-email` to `App.tsx`.

### Out of scope

- Pay-first / pre-payment signup flow (we discussed; sticking with current order: signup → verify → dashboard → pay)
- The 4 security scan findings shown in your panel (can tackle in a separate pass)
- Email template branding (already done)
- Password reset (already works)

### Edge cases handled

- Email in spam → Resend button with cooldown
- Typo'd email → "Sign out and use a different email" link
- Already-confirmed existing users → unaffected, their `email_confirmed_at` is already set
- Returning unverified user from a previous session → guard catches them and routes to `/verify-email`
