-- 1) Plan limits: Silver 3 staff, unlimited services; no SMS on any plan.
CREATE OR REPLACE FUNCTION public.tier_staff_limit(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _tier WHEN 'silver' THEN 3 WHEN 'gold' THEN 10 WHEN 'platinum' THEN NULL ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.tier_services_limit(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _tier WHEN 'silver' THEN NULL WHEN 'gold' THEN NULL WHEN 'platinum' THEN NULL ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.tier_allows(_tier text, _feature text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  select case _feature
    when 'reviews'          then _tier in ('gold','platinum')
    when 'waitlist'         then _tier in ('gold','platinum')
    when 'sms_reminders'    then false
    when 'custom_branding'  then _tier in ('gold','platinum')
    when 'advanced_analytics' then _tier in ('gold','platinum')
    when 'day_mode'         then _tier in ('gold','platinum')
    when 'resources'        then _tier in ('gold','platinum')
    when 'campaigns'        then _tier in ('gold','platinum')
    when 'promo_codes'      then _tier in ('gold','platinum')
    when 'csv_export'       then _tier = 'platinum'
    when 'gift_codes'       then _tier = 'platinum'
    when 'api_access'       then _tier = 'platinum'
    when 'remove_branding'  then _tier = 'platinum'
    else false
  end;
$$;

-- 2) Flat booking fee replaces the percentage fee.
DROP FUNCTION IF EXISTS public.tier_fee_percent(text);
DROP FUNCTION IF EXISTS public.is_founding_discount_active(uuid);

-- Booking fee per paid booking, in minor units (pence).
CREATE OR REPLACE FUNCTION public.tier_booking_fee_minor(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _tier WHEN 'platinum' THEN 0 ELSE 30 END;
$$;

-- Monthly cap on booking fees, in minor units (pence).
CREATE OR REPLACE FUNCTION public.tier_booking_fee_cap_minor(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _tier WHEN 'platinum' THEN 0 ELSE 2500 END;
$$;

-- Tier used for booking fees: trial (or no plan) => silver terms.
CREATE OR REPLACE FUNCTION public.booking_fee_tier(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN s.tier IS NULL OR s.status = 'trialing' THEN 'silver'
    ELSE lower(s.tier)
  END
  FROM (SELECT NULL::int AS d) x
  LEFT JOIN LATERAL (
    SELECT tier, status FROM public.subscriptions
    WHERE user_id = _user_id AND subscribed = true
    ORDER BY created_at DESC LIMIT 1
  ) s ON true;
$$;

-- First day of the month in UK time.
CREATE OR REPLACE FUNCTION public.booking_fee_month(_at timestamptz)
RETURNS date LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT date_trunc('month', (_at AT TIME ZONE 'Europe/London'))::date;
$$;

CREATE TABLE public.booking_fee_months (
  user_id uuid NOT NULL,
  environment text NOT NULL,
  month date NOT NULL,
  used_minor integer NOT NULL DEFAULT 0,
  cap_minor integer NOT NULL DEFAULT 2500,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, environment, month)
);
GRANT SELECT ON public.booking_fee_months TO authenticated;
GRANT ALL ON public.booking_fee_months TO service_role;
ALTER TABLE public.booking_fee_months ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own booking fee months" ON public.booking_fee_months
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all booking fee months" ON public.booking_fee_months
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.booking_fee_charges (
  booking_ref text PRIMARY KEY,
  user_id uuid NOT NULL,
  environment text NOT NULL,
  month date NOT NULL,
  fee_minor integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_fee_charges_status_chk CHECK (status IN ('reserved','charged','released'))
);
CREATE INDEX idx_booking_fee_charges_user ON public.booking_fee_charges(user_id, environment, month);
GRANT SELECT ON public.booking_fee_charges TO authenticated;
GRANT ALL ON public.booking_fee_charges TO service_role;
ALTER TABLE public.booking_fee_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own booking fee charges" ON public.booking_fee_charges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all booking fee charges" ON public.booking_fee_charges
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Atomically reserve this booking's fee against the monthly cap.
-- Once per booking: a booking already charged returns 0 (e.g. balance payment);
-- a retry of a still-reserved attempt returns the same reserved amount.
CREATE OR REPLACE FUNCTION public.reserve_booking_fee(
  _user_id uuid, _environment text, _booking_ref text, _charge_minor integer, _at timestamptz DEFAULT now()
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_tier text := public.booking_fee_tier(_user_id);
  v_fee integer := public.tier_booking_fee_minor(v_tier);
  v_cap integer := public.tier_booking_fee_cap_minor(v_tier);
  v_month date := public.booking_fee_month(_at);
  v_used integer;
  v_take integer;
  v_existing public.booking_fee_charges%ROWTYPE;
BEGIN
  IF _environment NOT IN ('sandbox','live') THEN RAISE EXCEPTION 'Invalid environment'; END IF;
  IF _booking_ref IS NULL OR length(_booking_ref) = 0 THEN RAISE EXCEPTION 'Missing booking reference'; END IF;

  -- Serialise every reservation for this business+month on one row lock.
  INSERT INTO public.booking_fee_months (user_id, environment, month, cap_minor)
  VALUES (_user_id, _environment, v_month, v_cap)
  ON CONFLICT (user_id, environment, month) DO NOTHING;
  SELECT used_minor INTO v_used FROM public.booking_fee_months
  WHERE user_id = _user_id AND environment = _environment AND month = v_month FOR UPDATE;

  SELECT * INTO v_existing FROM public.booking_fee_charges WHERE booking_ref = _booking_ref FOR UPDATE;
  IF FOUND THEN
    IF v_existing.status = 'charged' THEN RETURN 0; END IF;
    IF v_existing.status = 'reserved' THEN RETURN v_existing.fee_minor; END IF;
  END IF;

  v_take := GREATEST(0, LEAST(v_fee, v_cap - v_used, GREATEST(0, COALESCE(_charge_minor, 0))));

  UPDATE public.booking_fee_months
  SET used_minor = used_minor + v_take, cap_minor = v_cap, updated_at = now()
  WHERE user_id = _user_id AND environment = _environment AND month = v_month;

  INSERT INTO public.booking_fee_charges (booking_ref, user_id, environment, month, fee_minor, status)
  VALUES (_booking_ref, _user_id, _environment, v_month, v_take, 'reserved')
  ON CONFLICT (booking_ref) DO UPDATE
    SET month = EXCLUDED.month, fee_minor = EXCLUDED.fee_minor, status = 'reserved',
        user_id = EXCLUDED.user_id, environment = EXCLUDED.environment, updated_at = now();
  RETURN v_take;
END;
$$;

-- The charge succeeded: the fee is final and keeps counting (even after refunds).
CREATE OR REPLACE FUNCTION public.confirm_booking_fee(_booking_ref text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.booking_fee_charges SET status = 'charged', updated_at = now()
  WHERE booking_ref = _booking_ref AND status = 'reserved';
$$;

-- The charge failed / was never made: give the reserved amount back to the cap.
CREATE OR REPLACE FUNCTION public.release_booking_fee(_booking_ref text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.booking_fee_charges%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.booking_fee_charges WHERE booking_ref = _booking_ref;
  IF NOT FOUND OR r.status <> 'reserved' THEN RETURN; END IF;
  PERFORM 1 FROM public.booking_fee_months
    WHERE user_id = r.user_id AND environment = r.environment AND month = r.month FOR UPDATE;
  UPDATE public.booking_fee_charges SET status = 'released', updated_at = now()
    WHERE booking_ref = _booking_ref AND status = 'reserved';
  IF FOUND THEN
    UPDATE public.booking_fee_months SET used_minor = GREATEST(0, used_minor - r.fee_minor), updated_at = now()
    WHERE user_id = r.user_id AND environment = r.environment AND month = r.month;
  END IF;
END;
$$;

-- Release reservations for checkouts that were never paid (sessions expire after 1h).
CREATE OR REPLACE FUNCTION public.release_stale_booking_fees(_older_than interval DEFAULT interval '26 hours')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN SELECT booking_ref FROM public.booking_fee_charges
           WHERE status = 'reserved' AND created_at < now() - _older_than LOOP
    PERFORM public.release_booking_fee(r.booking_ref);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_booking_fee(uuid, text, text, integer, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_booking_fee(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_booking_fee(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_stale_booking_fees(interval) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.booking_fee_tier(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_booking_fee(uuid, text, text, integer, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_booking_fee(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_booking_fee(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stale_booking_fees(interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.booking_fee_tier(uuid) TO service_role;

-- 3) Founding members: first 100 businesses to start a real subscription.
CREATE TABLE public.founding_members (
  user_id uuid PRIMARY KEY,
  founding_member boolean NOT NULL DEFAULT true,
  founding_member_since timestamptz NOT NULL DEFAULT now(),
  tier_at_join text,
  price_id_at_join text
);
GRANT SELECT ON public.founding_members TO authenticated;
GRANT ALL ON public.founding_members TO service_role;
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own founding status" ON public.founding_members
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all founding members" ON public.founding_members
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.mark_founding_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.subscribed IS NOT TRUE
     OR NEW.status NOT IN ('active','trialing')
     OR NEW.stripe_subscription_id IS NULL
     OR COALESCE(NEW.price_id, '') LIKE 'gift\_%'
     OR public.has_role(NEW.user_id, 'admin') THEN
    RETURN NEW;
  END IF;
  -- One at a time so the 100 limit can't be overshot.
  PERFORM pg_advisory_xact_lock(hashtext('booksuite_founding_members'));
  IF EXISTS (SELECT 1 FROM public.founding_members WHERE user_id = NEW.user_id) THEN RETURN NEW; END IF;
  IF (SELECT count(*) FROM public.founding_members) < 100 THEN
    INSERT INTO public.founding_members (user_id, tier_at_join, price_id_at_join)
    VALUES (NEW.user_id, NEW.tier, NEW.price_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_founding_member
AFTER INSERT OR UPDATE OF subscribed, status, stripe_subscription_id ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.mark_founding_member();

CREATE OR REPLACE FUNCTION public.get_founding_spots_remaining()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT GREATEST(0, 100 - (SELECT count(*)::int FROM public.founding_members));
$$;