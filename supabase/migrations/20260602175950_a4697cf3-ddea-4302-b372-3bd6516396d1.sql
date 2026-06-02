CREATE UNIQUE INDEX IF NOT EXISTS bookings_stripe_checkout_session_id_uidx
  ON public.bookings (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bookings_stripe_payment_intent_id_idx
  ON public.bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;