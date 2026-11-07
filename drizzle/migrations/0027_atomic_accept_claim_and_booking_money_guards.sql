ALTER TABLE public.pending_bookings ADD COLUMN charge_attempts integer NOT NULL DEFAULT 0;

CREATE FUNCTION public.claim_pending_booking_charge(_pending_id uuid, _user_id uuid)
RETURNS SETOF public.pending_bookings
LANGUAGE sql VOLATILE SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.pending_bookings
  SET status = 'charging', charge_attempts = charge_attempts + 1
  WHERE id = _pending_id AND user_id = _user_id
    AND status IN ('awaiting_owner', 'charge_failed')
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_pending_booking_charge(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_booking_charge(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_paid_booking_cancel()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon')
     AND NEW.status IN ('cancelled', 'declined', 'cancelled_by_client')
     AND NEW.status IS DISTINCT FROM OLD.status
     AND OLD.payment_status IN ('paid', 'refund_failed', 'refund_processing') THEN
    RAISE EXCEPTION 'Paid bookings must be cancelled with the Cancel action so the client is refunded' USING ERRCODE = 'P0001';
  END IF;
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon')
     AND (NEW.payment_status IS DISTINCT FROM OLD.payment_status
          OR NEW.refund_id IS DISTINCT FROM OLD.refund_id
          OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
          OR NEW.refund_error IS DISTINCT FROM OLD.refund_error
          OR NEW.refund_attempts IS DISTINCT FROM OLD.refund_attempts
          OR NEW.stripe_fee_amount IS DISTINCT FROM OLD.stripe_fee_amount
          OR NEW.ledger_collected_amount IS DISTINCT FROM OLD.ledger_collected_amount
          OR NEW.dispute_id IS DISTINCT FROM OLD.dispute_id
          OR NEW.dispute_reversed_minor IS DISTINCT FROM OLD.dispute_reversed_minor
          OR ((coalesce(OLD.payment_status, 'unpaid') NOT IN ('unpaid', 'none', '')
               OR OLD.stripe_payment_intent_id IS NOT NULL
               OR OLD.stripe_charge_id IS NOT NULL
               OR OLD.stripe_checkout_session_id IS NOT NULL
               OR OLD.refund_id IS NOT NULL)
              AND (NEW.charge_amount IS DISTINCT FROM OLD.charge_amount
                   OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
                   OR NEW.platform_fee_amount IS DISTINCT FROM OLD.platform_fee_amount
                   OR NEW.service_price IS DISTINCT FROM OLD.service_price
                   OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
                   OR NEW.stripe_charge_id IS DISTINCT FROM OLD.stripe_charge_id
                   OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id))) THEN
    RAISE EXCEPTION 'Payment details on a booking can only be changed by the payment system' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.guard_browser_booking_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon') THEN
    NEW.payment_status := 'unpaid';
    NEW.stripe_payment_intent_id := NULL;
    NEW.stripe_charge_id := NULL;
    NEW.stripe_checkout_session_id := NULL;
    NEW.refund_id := NULL;
    NEW.refund_amount := NULL;
    NEW.charge_amount := NULL;
    NEW.platform_fee_amount := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_browser_booking_insert() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_browser_booking_insert BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_browser_booking_insert();