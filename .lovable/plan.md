## Test plan: Stripe Connect sandbox run-through

No code changes — just a guided test using Stripe's test card so we confirm onboarding, deposits, webhooks, calendar updates, refunds, and emails all work before you take real money.

### 1. Connect a Stripe account (sandbox)
- Log in to BookSuite as a normal salon-owner user (not admin).
- Dashboard → **Payments** → **Connect Stripe Account**.
- On Stripe's hosted onboarding, fill the test data Stripe pre-fills (or use any details — sandbox doesn't verify). Use phone `000-000-0000` and SSN `000-00-0000` if asked.
- Finish → you should land back on `/payments/return` with status **Active / charges enabled**.

### 2. Take a test booking + deposit
- Open your public booking widget (or the embedded calendar) as a customer would.
- Book any slot. At checkout, use Stripe's test card:
  - Card: `4242 4242 4242 4242`
  - Expiry: any future date · CVC: any 3 digits · Postcode: any
- Complete payment → you should be redirected to the success page.

### 3. Verify what should happen automatically
- **Calendar**: the new booking appears as **Paid / Confirmed** (not pending).
- **Owner email**: "New booking paid" email arrives at the salon owner address.
- **Client email**: booking confirmation email arrives at the test customer email.
- **Dashboard → Payments**: transaction shows up with platform fee deducted.
- **Stripe webhook**: confirmed server-side (not just via redirect).

### 4. Test a refund
- Dashboard → open the booking → **Refund / Cancel**.
- Confirm:
  - Booking status flips to **Cancelled / Refunded**.
  - Refund email goes to the client.
  - Stripe shows the refund on the connected account.

### 5. Test the failure paths (optional but recommended)
- Card decline: `4000 0000 0000 0002` → booking should NOT be created, no email sent.
- 3D Secure: `4000 0025 0000 3155` → triggers the auth modal, then completes.

### What I'll do if anything breaks
You report back what failed at which step (and any error toast / email that didn't arrive). I'll pull the relevant edge-function logs (`stripe-connect-webhook`, `connect-create-checkout`, `send-transactional-email`) and patch from there.

### When to flip to live
Once all 4 green steps above pass in sandbox, switch your Payments setting to **Live**, redo step 1 with a real Stripe account (your salon owner's real bank details), and do one real £1 booking on yourself to confirm before announcing.
