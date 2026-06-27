ALTER TABLE public.pending_bookings
  ADD COLUMN IF NOT EXISTS payment_environment text NOT NULL DEFAULT 'live';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_environment text NOT NULL DEFAULT 'live';

ALTER TABLE public.pending_bookings
  DROP CONSTRAINT IF EXISTS pending_bookings_payment_environment_check;
ALTER TABLE public.pending_bookings
  ADD CONSTRAINT pending_bookings_payment_environment_check
  CHECK (payment_environment IN ('sandbox', 'live'));

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_environment_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_environment_check
  CHECK (payment_environment IN ('sandbox', 'live'));

CREATE INDEX IF NOT EXISTS idx_pending_bookings_payment_environment
  ON public.pending_bookings (payment_environment);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_environment
  ON public.bookings (payment_environment);