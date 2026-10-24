ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_fee_amount numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS ledger_collected_amount numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dispute_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dispute_reversed_minor integer;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status = ANY (ARRAY['unpaid','paid','refunded','failed','refund_processing','refund_failed','partially_refunded','disputed','dispute_lost']));

CREATE TABLE public.business_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('stripe_fee_shortfall','refund_shortfall','unreversed_refund','dispute_amount','dispute_fee','dispute_won_credit','collected')),
  amount_minor integer NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  environment text NOT NULL DEFAULT 'live' CHECK (environment IN ('sandbox','live')),
  stripe_object_id text NOT NULL UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_ledger_user ON public.business_ledger(user_id, environment, created_at);
GRANT SELECT ON public.business_ledger TO authenticated;
GRANT ALL ON public.business_ledger TO service_role;
ALTER TABLE public.business_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own ledger" ON public.business_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all ledger" ON public.business_ledger FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Invoice items raised against a business's subscription to collect its tab.
CREATE TABLE public.ledger_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_invoice_item_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  amount_minor integer NOT NULL,
  currency text NOT NULL,
  environment text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','void')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ledger_invoice_items TO authenticated;
GRANT ALL ON public.ledger_invoice_items TO service_role;
ALTER TABLE public.ledger_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own ledger invoices" ON public.ledger_invoice_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all ledger invoices" ON public.ledger_invoice_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE VIEW public.business_ledger_balances WITH (security_invoker = true) AS
  SELECT user_id, environment, currency, sum(amount_minor)::bigint AS balance_minor, min(created_at) AS oldest_entry_at, count(*) AS entries
  FROM public.business_ledger GROUP BY user_id, environment, currency;
GRANT SELECT ON public.business_ledger_balances TO authenticated;
GRANT SELECT ON public.business_ledger_balances TO service_role;