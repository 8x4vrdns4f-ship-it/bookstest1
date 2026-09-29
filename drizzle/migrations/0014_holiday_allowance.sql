ALTER TABLE public.business_settings ADD COLUMN default_leave_days integer NOT NULL DEFAULT 28;
ALTER TABLE public.business_settings ADD COLUMN holiday_country text;
ALTER TABLE public.employees ADD COLUMN annual_leave_days integer;

CREATE TABLE public.public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  holiday_date date NOT NULL,
  name text NOT NULL,
  UNIQUE (country, holiday_date)
);
GRANT SELECT ON public.public_holidays TO authenticated;
GRANT ALL ON public.public_holidays TO service_role;
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can read public holidays"
  ON public.public_holidays FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.validate_leave_settings()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'business_settings' THEN
    IF NEW.default_leave_days IS NULL OR NEW.default_leave_days < 0 OR NEW.default_leave_days > 366 THEN
      RAISE EXCEPTION 'default_leave_days must be between 0 and 366';
    END IF;
    IF NEW.holiday_country IS NOT NULL AND NEW.holiday_country !~ '^[A-Z]{2}$' THEN
      RAISE EXCEPTION 'holiday_country must be a 2-letter country code';
    END IF;
  ELSIF TG_TABLE_NAME = 'employees' THEN
    IF NEW.annual_leave_days IS NOT NULL AND (NEW.annual_leave_days < 0 OR NEW.annual_leave_days > 366) THEN
      RAISE EXCEPTION 'annual_leave_days must be between 0 and 366';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_leave_settings_bs
  BEFORE INSERT OR UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.validate_leave_settings();
CREATE TRIGGER trg_validate_leave_settings_emp
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.validate_leave_settings();

CREATE OR REPLACE FUNCTION public.leave_working_days(_employee_id uuid, _start date, _end date)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_business uuid;
  v_hours jsonb;
  v_country text;
  v_has_shifts boolean;
  v_count integer := 0;
  v_d date;
  v_key text;
  v_day jsonb;
BEGIN
  IF _end < _start THEN RETURN 0; END IF;
  SELECT user_id INTO v_business FROM public.employees WHERE id = _employee_id;
  IF v_business IS NULL THEN RETURN 0; END IF;
  SELECT working_hours, holiday_country INTO v_hours, v_country
    FROM public.business_settings WHERE user_id = v_business;
  SELECT EXISTS (
    SELECT 1 FROM public.employee_shifts
    WHERE employee_id = _employee_id AND shift_date BETWEEN _start AND _end
  ) INTO v_has_shifts;

  FOR v_d IN SELECT generate_series(_start, _end, interval '1 day')::date LOOP
    v_key := (ARRAY['mon','tue','wed','thu','fri','sat','sun'])[extract(isodow FROM v_d)];
    v_day := COALESCE(v_hours -> v_key, '{}'::jsonb);
    IF COALESCE((v_day ->> 'closed')::boolean, true) THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM public.date_overrides WHERE user_id = v_business AND override_date = v_d AND closed) THEN CONTINUE; END IF;
    IF v_country IS NOT NULL AND EXISTS (SELECT 1 FROM public.public_holidays WHERE country = v_country AND holiday_date = v_d) THEN CONTINUE; END IF;
    IF v_has_shifts AND NOT EXISTS (SELECT 1 FROM public.employee_shifts WHERE employee_id = _employee_id AND shift_date = v_d) THEN CONTINUE; END IF;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.leave_working_days(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_working_days(uuid, date, date) TO service_role;

CREATE OR REPLACE FUNCTION public.get_leave_balance(_employee_id uuid, _year integer)
RETURNS TABLE(allowance integer, used integer, pending integer, remaining integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_emp record;
  v_year_start date := make_date(_year, 1, 1);
  v_year_end date := make_date(_year, 12, 31);
  v_used integer := 0;
  v_pending integer := 0;
  v_req record;
BEGIN
  SELECT e.id, e.user_id AS business_user_id, e.auth_user_id, e.annual_leave_days,
         bs.default_leave_days
    INTO v_emp
    FROM public.employees e
    JOIN public.business_settings bs ON bs.user_id = e.user_id
   WHERE e.id = _employee_id;
  IF v_emp IS NULL THEN RETURN; END IF;

  IF auth.uid() IS DISTINCT FROM v_emp.auth_user_id
     AND auth.uid() IS DISTINCT FROM v_emp.business_user_id
     AND NOT public.has_company_permission(auth.uid(), v_emp.business_user_id, 'approve_requests') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  FOR v_req IN
    SELECT start_date, end_date, status FROM public.time_off_requests
    WHERE employee_id = _employee_id
      AND status IN ('approved', 'pending')
      AND start_date <= v_year_end AND end_date >= v_year_start
  LOOP
    IF v_req.status = 'approved' THEN
      v_used := v_used + public.leave_working_days(_employee_id, GREATEST(v_req.start_date, v_year_start), LEAST(v_req.end_date, v_year_end));
    ELSE
      v_pending := v_pending + public.leave_working_days(_employee_id, GREATEST(v_req.start_date, v_year_start), LEAST(v_req.end_date, v_year_end));
    END IF;
  END LOOP;

  allowance := COALESCE(v_emp.annual_leave_days, v_emp.default_leave_days, 28);
  used := v_used;
  pending := v_pending;
  remaining := GREATEST(0, allowance - v_used);
  RETURN NEXT;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_leave_balance(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leave_balance(uuid, integer) TO service_role;