CREATE OR REPLACE FUNCTION public.guard_paid_booking_cancel()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon')
     AND NEW.status IN ('cancelled', 'declined', 'cancelled_by_client')
     AND NEW.status IS DISTINCT FROM OLD.status
     AND OLD.payment_status IN ('paid', 'refund_failed', 'refund_processing') THEN
    RAISE EXCEPTION 'Paid bookings must be cancelled with the Cancel action so the client is refunded'
      USING ERRCODE = 'P0001';
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
          OR NEW.dispute_reversed_minor IS DISTINCT FROM OLD.dispute_reversed_minor) THEN
    RAISE EXCEPTION 'Payment details on a booking can only be changed by the payment system'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;