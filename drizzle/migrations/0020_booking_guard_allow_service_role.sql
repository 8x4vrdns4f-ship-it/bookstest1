CREATE OR REPLACE FUNCTION public.guard_bookings_employee_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  -- Server-side payment code (service role) and direct DB maintenance are trusted.
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id
     OR NEW.platform_fee_amount IS DISTINCT FROM OLD.platform_fee_amount
     OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.stripe_charge_id IS DISTINCT FROM OLD.stripe_charge_id
     OR NEW.refund_id IS DISTINCT FROM OLD.refund_id
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.service_price IS DISTINCT FROM OLD.service_price
     OR NEW.charge_amount IS DISTINCT FROM OLD.charge_amount THEN
    RAISE EXCEPTION 'Employees cannot modify financial, payment, or assignment fields on bookings';
  END IF;
  RETURN NEW;
END;
$function$;

-- The same guard was attached twice; keep one.
DROP TRIGGER IF EXISTS trg_guard_bookings_employee_update ON public.bookings;