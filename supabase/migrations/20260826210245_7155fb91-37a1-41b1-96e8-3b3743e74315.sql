CREATE OR REPLACE FUNCTION public.tier_services_limit(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _tier
    WHEN 'silver'   THEN 5
    WHEN 'gold'     THEN NULL
    WHEN 'platinum' THEN NULL
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.tier_resources_limit(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _tier
    WHEN 'silver'   THEN 0
    WHEN 'gold'     THEN 10
    WHEN 'platinum' THEN NULL
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.tier_retention_months(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _tier
    WHEN 'silver'   THEN 6
    WHEN 'gold'     THEN 24
    WHEN 'platinum' THEN NULL
    ELSE 6
  END;
$$;

CREATE OR REPLACE FUNCTION public.tier_allows(_tier text, _feature text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE _feature
    WHEN 'reviews'          THEN _tier IN ('gold','platinum')
    WHEN 'waitlist'         THEN _tier IN ('gold','platinum')
    WHEN 'sms_reminders'    THEN _tier IN ('gold','platinum')
    WHEN 'custom_branding'  THEN _tier IN ('gold','platinum')
    WHEN 'advanced_analytics' THEN _tier IN ('gold','platinum')
    WHEN 'day_mode'         THEN _tier IN ('gold','platinum')
    WHEN 'resources'        THEN _tier IN ('gold','platinum')
    WHEN 'csv_export'       THEN _tier = 'platinum'
    WHEN 'gift_codes'       THEN _tier = 'platinum'
    WHEN 'api_access'       THEN _tier = 'platinum'
    WHEN 'remove_branding'  THEN _tier = 'platinum'
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_tier_allows(_user_id uuid, _feature text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.tier_allows(public.get_active_tier(_user_id), _feature);
$$;

REVOKE ALL ON FUNCTION public.user_tier_allows(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_service_tier_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_tier text;
  v_limit integer;
  v_count integer;
BEGIN
  v_tier := public.get_active_tier(NEW.user_id);
  IF v_tier IS NULL THEN
    RAISE EXCEPTION 'NO_SUBSCRIPTION: This business has no active subscription.';
  END IF;
  v_limit := public.tier_services_limit(v_tier);
  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO v_count FROM public.services WHERE user_id = NEW.user_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'TIER_LIMIT_SERVICES: % plan allows % service(s) (used %)', v_tier, v_limit, v_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_service_tier_limit ON public.services;
CREATE TRIGGER trg_enforce_service_tier_limit
BEFORE INSERT ON public.services
FOR EACH ROW EXECUTE FUNCTION public.enforce_service_tier_limit();

CREATE OR REPLACE FUNCTION public.enforce_resource_tier_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_tier text;
  v_limit integer;
  v_count integer;
BEGIN
  v_tier := public.get_active_tier(NEW.user_id);
  IF v_tier IS NULL THEN
    RAISE EXCEPTION 'NO_SUBSCRIPTION: This business has no active subscription.';
  END IF;
  v_limit := public.tier_resources_limit(v_tier);
  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;
  IF v_limit = 0 THEN
    RAISE EXCEPTION 'TIER_LIMIT_RESOURCES: Bookable resources are available on Gold and Platinum plans.';
  END IF;
  SELECT COUNT(*) INTO v_count FROM public.resources WHERE user_id = NEW.user_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'TIER_LIMIT_RESOURCES: % plan allows % resource(s) (used %)', v_tier, v_limit, v_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_resource_tier_limit ON public.resources;
CREATE TRIGGER trg_enforce_resource_tier_limit
BEFORE INSERT ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.enforce_resource_tier_limit();

DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);
CREATE FUNCTION public.get_widget_settings(p_user_id uuid)
RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text, deposit_amount numeric, currency text, timezone text, working_hours jsonb, allow_same_day boolean, max_advance_days integer, buffer_minutes integer, resources_enabled boolean, resource_label text, party_size_enabled boolean, assignment_mode text, waitlist_enabled boolean, services_enabled boolean, payment_mode text, booking_mode text, min_rental_days integer, max_rental_days integer, payments_enabled boolean, show_branding boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT bs.user_id, bs.business_name, bs.welcome_message,
         CASE WHEN public.tier_allows(public.get_active_tier(bs.user_id), 'custom_branding')
              THEN bs.accent_color ELSE '#4FC3F7' END AS accent_color,
         bs.deposit_amount,
         bs.currency, bs.timezone, bs.working_hours, bs.allow_same_day, bs.max_advance_days,
         bs.buffer_minutes,
         (bs.resources_enabled AND public.tier_allows(public.get_active_tier(bs.user_id), 'resources')) AS resources_enabled,
         bs.resource_label, bs.party_size_enabled,
         bs.assignment_mode,
         (bs.waitlist_enabled AND public.tier_allows(public.get_active_tier(bs.user_id), 'waitlist')) AS waitlist_enabled,
         bs.services_enabled, bs.payment_mode,
         CASE WHEN bs.booking_mode = 'daily' AND NOT public.tier_allows(public.get_active_tier(bs.user_id), 'day_mode')
              THEN 'hourly' ELSE bs.booking_mode END AS booking_mode,
         bs.min_rental_days, bs.max_rental_days,
         EXISTS (
           SELECT 1 FROM public.connect_accounts ca
           WHERE ca.user_id = bs.user_id AND ca.charges_enabled = true
         ) AS payments_enabled,
         NOT public.tier_allows(public.get_active_tier(bs.user_id), 'remove_branding') AS show_branding
  FROM public.business_settings bs
  WHERE bs.user_id = p_user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.join_waitlist(p_user_id uuid, p_client_name text, p_client_email text, p_client_phone text, p_service text, p_preferred_date date, p_preferred_time_start time without time zone, p_preferred_time_end time without time zone, p_party_size integer, p_notes text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_enabled boolean;
  v_id uuid;
BEGIN
  IF p_client_name IS NULL OR length(trim(p_client_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF p_client_email IS NULL OR length(trim(p_client_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF p_preferred_date IS NULL OR p_preferred_date < current_date THEN
    RAISE EXCEPTION 'A future date is required';
  END IF;

  IF NOT public.check_rate_limit('waitlist', 'email:' || lower(trim(p_client_email)), 8, 3600) THEN
    RAISE EXCEPTION 'RATE_LIMITED: Too many waitlist requests. Please try again later.';
  END IF;

  SELECT waitlist_enabled INTO v_enabled FROM public.business_settings WHERE user_id = p_user_id;
  IF v_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Waitlist not enabled for this business';
  END IF;

  IF NOT public.tier_allows(public.get_active_tier(p_user_id), 'waitlist') THEN
    RAISE EXCEPTION 'Waitlist not enabled for this business';
  END IF;

  INSERT INTO public.waitlist_entries (
    user_id, client_name, client_email, client_phone, service,
    preferred_date, preferred_time_start, preferred_time_end,
    party_size, notes
  ) VALUES (
    p_user_id, trim(p_client_name), lower(trim(p_client_email)), p_client_phone, p_service,
    p_preferred_date, p_preferred_time_start, p_preferred_time_end,
    p_party_size, p_notes
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_gift_code()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.subscribed = true
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
      AND s.tier = 'platinum'
  );
$$;