
-- Helper: returns the active tier for a user ('silver'|'gold'|'platinum') or NULL if none
CREATE OR REPLACE FUNCTION public.get_active_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier
  FROM public.subscriptions
  WHERE user_id = _user_id
    AND subscribed = true
    AND (current_period_end IS NULL OR current_period_end > now())
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Helper: monthly booking limit per tier (NULL = unlimited)
CREATE OR REPLACE FUNCTION public.tier_booking_limit(_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _tier
    WHEN 'silver'   THEN 50
    WHEN 'gold'     THEN 300
    WHEN 'platinum' THEN NULL
    ELSE 0
  END;
$$;

-- Helper: staff limit per tier (NULL = unlimited)
CREATE OR REPLACE FUNCTION public.tier_staff_limit(_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _tier
    WHEN 'silver'   THEN 1
    WHEN 'gold'     THEN 10
    WHEN 'platinum' THEN NULL
    ELSE 0
  END;
$$;

-- Trigger: block booking inserts that exceed monthly limit for the business owner
CREATE OR REPLACE FUNCTION public.enforce_booking_tier_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_limit integer;
  v_count integer;
  v_month_start date;
BEGIN
  v_tier := public.get_active_tier(NEW.user_id);
  IF v_tier IS NULL THEN
    RAISE EXCEPTION 'NO_SUBSCRIPTION: This business has no active subscription.';
  END IF;

  v_limit := public.tier_booking_limit(v_tier);
  IF v_limit IS NULL THEN
    RETURN NEW; -- unlimited
  END IF;

  v_month_start := date_trunc('month', now())::date;
  SELECT COUNT(*) INTO v_count
  FROM public.bookings
  WHERE user_id = NEW.user_id
    AND created_at >= v_month_start;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'TIER_LIMIT_BOOKINGS: % plan allows % bookings/month (used %)', v_tier, v_limit, v_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_booking_tier_limit ON public.bookings;
CREATE TRIGGER trg_enforce_booking_tier_limit
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_tier_limit();

-- Trigger: block employee inserts that exceed staff limit
CREATE OR REPLACE FUNCTION public.enforce_employee_tier_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_limit integer;
  v_count integer;
BEGIN
  v_tier := public.get_active_tier(NEW.user_id);
  IF v_tier IS NULL THEN
    RAISE EXCEPTION 'NO_SUBSCRIPTION: This business has no active subscription.';
  END IF;

  v_limit := public.tier_staff_limit(v_tier);
  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.employees WHERE user_id = NEW.user_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'TIER_LIMIT_STAFF: % plan allows % staff member(s) (used %)', v_tier, v_limit, v_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_employee_tier_limit ON public.employees;
CREATE TRIGGER trg_enforce_employee_tier_limit
BEFORE INSERT ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_tier_limit();
