
-- Extend pending_bookings for the "capture card now, charge on accept" flow.
ALTER TABLE public.pending_bookings
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id text,
  ADD COLUMN IF NOT EXISTS charge_error text,
  ADD COLUMN IF NOT EXISTS decline_reason text;

-- Widen the default expires_at window to 48h for new rows (existing rows unaffected).
ALTER TABLE public.pending_bookings
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '48 hours');

-- Ensure stripe_checkout_session_id can be null (SetupIntent flow doesn't have one at insert).
ALTER TABLE public.pending_bookings
  ALTER COLUMN stripe_checkout_session_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pending_bookings_user_status
  ON public.pending_bookings (user_id, status);

-- Owner (business user) can SELECT / UPDATE / DELETE their own pending rows so the
-- dashboard queue can render them. Service role policy already exists.
DROP POLICY IF EXISTS "Owners view own pending bookings" ON public.pending_bookings;
CREATE POLICY "Owners view own pending bookings"
  ON public.pending_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT policy for owners: rows are always inserted server-side via edge functions.
-- No UPDATE / DELETE for owners: dashboard uses edge functions (charge-booking-deposit,
-- decline-pending-booking) which run as service role.

GRANT SELECT ON public.pending_bookings TO authenticated;
