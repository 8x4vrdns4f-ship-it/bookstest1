ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_error text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_amount numeric;

CREATE OR REPLACE FUNCTION public.guard_paid_booking_cancel()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon')
     AND NEW.status IN ('cancelled', 'declined', 'cancelled_by_client')
     AND NEW.status IS DISTINCT FROM OLD.status
     AND OLD.payment_status IN ('paid', 'refund_failed') THEN
    RAISE EXCEPTION 'Paid bookings must be cancelled with the Cancel action so the client is refunded'
      USING ERRCODE = 'P0001';
  END IF;
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon')
     AND (NEW.payment_status IS DISTINCT FROM OLD.payment_status
          OR NEW.refund_id IS DISTINCT FROM OLD.refund_id
          OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
          OR NEW.refund_error IS DISTINCT FROM OLD.refund_error) THEN
    RAISE EXCEPTION 'Payment details on a booking can only be changed by the payment system'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_paid_booking_cancel ON public.bookings;
CREATE TRIGGER guard_paid_booking_cancel BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_paid_booking_cancel();

CREATE OR REPLACE FUNCTION public.guard_paid_booking_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon')
     AND (coalesce(OLD.payment_status, 'unpaid') NOT IN ('unpaid', 'none', '')
          OR OLD.stripe_payment_intent_id IS NOT NULL
          OR OLD.stripe_checkout_session_id IS NOT NULL
          OR OLD.stripe_charge_id IS NOT NULL
          OR OLD.refund_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Bookings with a payment record cannot be deleted — cancel them instead'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS guard_paid_booking_delete ON public.bookings;
CREATE TRIGGER guard_paid_booking_delete BEFORE DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_paid_booking_delete();