
-- Guard: prevent employees (non-owners) from modifying financial / assignment columns on bookings.
CREATE OR REPLACE FUNCTION public.guard_bookings_employee_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Business owner can change anything
  IF auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;
  -- Non-owner (assigned employee): block sensitive columns
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id
     OR NEW.platform_fee_amount IS DISTINCT FROM OLD.platform_fee_amount
     OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.stripe_charge_id IS DISTINCT FROM OLD.stripe_charge_id
     OR NEW.refund_id IS DISTINCT FROM OLD.refund_id
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.price IS DISTINCT FROM OLD.price THEN
    RAISE EXCEPTION 'Employees cannot modify financial, payment, or assignment fields on bookings';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_bookings_employee_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_bookings_employee_update ON public.bookings;
CREATE TRIGGER guard_bookings_employee_update
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_bookings_employee_update();

-- Guard: prevent employees from escalating their own role or hijacking auth/ownership fields.
CREATE OR REPLACE FUNCTION public.guard_employees_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Business owner can change anything on their employees
  IF auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;
  -- Self-update by employee: block sensitive columns
  IF NEW.role_id IS DISTINCT FROM OLD.role_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
     OR NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Employees cannot modify role, ownership, or auth identity fields';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_employees_self_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_employees_self_update ON public.employees;
CREATE TRIGGER guard_employees_self_update
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.guard_employees_self_update();
