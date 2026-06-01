
-- ============ business_settings: stop broad exposure ============
DROP POLICY IF EXISTS "Public can read business settings for widget" ON public.business_settings;
DROP POLICY IF EXISTS "Authenticated can lookup business by code" ON public.business_settings;

-- Widget-facing: only non-sensitive fields needed to render the booking widget
CREATE OR REPLACE FUNCTION public.get_widget_settings(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  business_name text,
  welcome_message text,
  accent_color text,
  deposit_amount numeric,
  currency text,
  timezone text,
  working_hours jsonb,
  allow_same_day boolean,
  max_advance_days integer,
  buffer_minutes integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT user_id, business_name, welcome_message, accent_color,
         deposit_amount, currency, timezone, working_hours,
         allow_same_day, max_advance_days, buffer_minutes
  FROM public.business_settings
  WHERE user_id = p_user_id;
$$;
REVOKE ALL ON FUNCTION public.get_widget_settings(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated;

-- Code lookup: returns only one row, minimum fields, for the join flow
CREATE OR REPLACE FUNCTION public.lookup_business_by_code(p_code text)
RETURNS TABLE(user_id uuid, business_name text, company_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT user_id, business_name, company_code
  FROM public.business_settings
  WHERE company_code = upper(p_code)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.lookup_business_by_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_business_by_code(text) TO authenticated;

-- ============ date_overrides: stop public table scan ============
DROP POLICY IF EXISTS "Public can read date overrides for widget" ON public.date_overrides;

CREATE OR REPLACE FUNCTION public.get_widget_date_overrides(p_user_id uuid, p_from date, p_to date)
RETURNS TABLE(override_date date, closed boolean, open_time time, close_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT override_date, closed, open_time, close_time
  FROM public.date_overrides
  WHERE user_id = p_user_id
    AND override_date BETWEEN p_from AND p_to;
$$;
REVOKE ALL ON FUNCTION public.get_widget_date_overrides(uuid, date, date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_widget_date_overrides(uuid, date, date) TO anon, authenticated;

-- ============ employees: block email-only privilege escalation ============
DROP POLICY IF EXISTS "Users can link employee row matching their email" ON public.employees;
DROP POLICY IF EXISTS "Users can view employee row matching their email" ON public.employees;

-- Secure join: requires company_code + email matching the caller's verified JWT email
CREATE OR REPLACE FUNCTION public.claim_employee_seat(p_company_code text)
RETURNS TABLE(employee_id uuid, business_user_id uuid, business_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_email text;
  v_caller_uid uuid;
  v_business_user_id uuid;
  v_business_name text;
  v_emp_id uuid;
BEGIN
  v_caller_uid := auth.uid();
  v_caller_email := lower(auth.jwt() ->> 'email');
  IF v_caller_uid IS NULL OR v_caller_email IS NULL OR v_caller_email = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT bs.user_id, bs.business_name INTO v_business_user_id, v_business_name
  FROM public.business_settings bs
  WHERE bs.company_code = upper(p_company_code)
  LIMIT 1;
  IF v_business_user_id IS NULL THEN
    RAISE EXCEPTION 'Company code not found';
  END IF;

  SELECT e.id INTO v_emp_id
  FROM public.employees e
  WHERE e.user_id = v_business_user_id
    AND lower(e.email) = v_caller_email
    AND e.auth_user_id IS NULL
  LIMIT 1;
  IF v_emp_id IS NULL THEN
    RAISE EXCEPTION 'No matching employee invite found for your email at that company';
  END IF;

  UPDATE public.employees SET auth_user_id = v_caller_uid WHERE id = v_emp_id;

  RETURN QUERY SELECT v_emp_id, v_business_user_id, v_business_name;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_employee_seat(text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_employee_seat(text) TO authenticated;

-- ============ lock down trigger / internal functions from API callers ============
REVOKE EXECUTE ON FUNCTION public.generate_booking_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_company_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_business_settings() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
