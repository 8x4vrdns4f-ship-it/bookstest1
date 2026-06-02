
-- Connect accounts (one per business owner)
CREATE TABLE public.connect_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL UNIQUE,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  country text,
  default_currency text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connect_accounts TO authenticated;
GRANT ALL ON public.connect_accounts TO service_role;

ALTER TABLE public.connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own connect account"
  ON public.connect_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages connect accounts"
  ON public.connect_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_connect_accounts_updated_at
  BEFORE UPDATE ON public.connect_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pending bookings (held until Stripe Checkout completes)
CREATE TABLE public.pending_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_checkout_session_id text UNIQUE,
  stripe_account_id text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  service text NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  notes text,
  deposit_amount numeric(10,2) NOT NULL,
  platform_fee_amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'awaiting_payment',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pending_bookings_session ON public.pending_bookings(stripe_checkout_session_id);
CREATE INDEX idx_pending_bookings_expires ON public.pending_bookings(expires_at);

GRANT ALL ON public.pending_bookings TO service_role;

ALTER TABLE public.pending_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages pending bookings"
  ON public.pending_bookings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Payment fields on bookings
ALTER TABLE public.bookings
  ADD COLUMN stripe_checkout_session_id text,
  ADD COLUMN stripe_payment_intent_id text,
  ADD COLUMN stripe_charge_id text,
  ADD COLUMN deposit_amount numeric(10,2),
  ADD COLUMN platform_fee_amount numeric(10,2),
  ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN refund_id text;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('unpaid','paid','refunded','failed'));

CREATE INDEX idx_bookings_payment_intent ON public.bookings(stripe_payment_intent_id);

-- Optional toggle for owners
ALTER TABLE public.business_settings
  ADD COLUMN require_deposit boolean NOT NULL DEFAULT true;
