CREATE OR REPLACE FUNCTION public.guard_employees_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_uid uuid := auth.uid();
  v_caller_email text := lower(auth.jwt() ->> 'email');
BEGIN
  -- Business owners retain full employee-management access.
  IF v_caller_uid = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- A signed-in invitee may only claim an unclaimed seat for their own
  -- authenticated identity when the verified JWT email matches the invite.
  IF OLD.auth_user_id IS NULL
     AND NEW.auth_user_id = v_caller_uid
     AND v_caller_uid IS NOT NULL
     AND v_caller_email IS NOT NULL
     AND lower(OLD.email) = v_caller_email
     AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
     AND NEW.role_id IS NOT DISTINCT FROM OLD.role_id
     AND NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  -- Employee self-service may not alter role, ownership, email, or auth identity.
  IF NEW.role_id IS DISTINCT FROM OLD.role_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
     OR NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Employees cannot modify role, ownership, or auth identity fields';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_employee_seat(p_company_code text)
RETURNS TABLE(employee_id uuid, business_user_id uuid, business_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_email text := lower(auth.jwt() ->> 'email');
  v_caller_uid uuid := auth.uid();
  v_business_user_id uuid;
  v_business_name text;
  v_emp_id uuid;
BEGIN
  IF v_caller_uid IS NULL OR v_caller_email IS NULL OR v_caller_email = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT bs.user_id, bs.business_name
    INTO v_business_user_id, v_business_name
  FROM public.business_settings bs
  WHERE bs.company_code = upper(trim(p_company_code))
  LIMIT 1;

  IF v_business_user_id IS NULL THEN
    RAISE EXCEPTION 'Company code not found';
  END IF;

  SELECT e.id INTO v_emp_id
  FROM public.employees e
  WHERE e.user_id = v_business_user_id
    AND lower(e.email) = v_caller_email
    AND (e.auth_user_id IS NULL OR e.auth_user_id = v_caller_uid)
  ORDER BY CASE WHEN e.auth_user_id = v_caller_uid THEN 0 ELSE 1 END, e.created_at ASC
  LIMIT 1;

  IF v_emp_id IS NULL THEN
    RAISE EXCEPTION 'No matching employee invite found for your email at that company';
  END IF;

  UPDATE public.employees
     SET auth_user_id = v_caller_uid
   WHERE id = v_emp_id
     AND auth_user_id IS NULL;

  RETURN QUERY SELECT v_emp_id, v_business_user_id, v_business_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_employee_seat_by_email()
RETURNS TABLE(employee_id uuid, business_user_id uuid, business_name text, role_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_emp_id uuid;
  v_biz_uid uuid;
  v_biz_name text;
  v_role text;
BEGIN
  IF v_uid IS NULL OR v_email IS NULL OR v_email = '' THEN
    RETURN;
  END IF;

  SELECT e.id, e.user_id INTO v_emp_id, v_biz_uid
  FROM public.employees e
  WHERE lower(e.email) = v_email
    AND (e.auth_user_id IS NULL OR e.auth_user_id = v_uid)
  ORDER BY CASE WHEN e.auth_user_id = v_uid THEN 0 ELSE 1 END, e.created_at ASC
  LIMIT 1;

  IF v_emp_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.employees
     SET auth_user_id = v_uid
   WHERE id = v_emp_id
     AND auth_user_id IS NULL;

  SELECT bs.business_name INTO v_biz_name
  FROM public.business_settings bs
  WHERE bs.user_id = v_biz_uid;

  SELECT cr.name INTO v_role
  FROM public.employees e
  LEFT JOIN public.company_roles cr ON cr.id = e.role_id
  WHERE e.id = v_emp_id;

  RETURN QUERY SELECT v_emp_id, v_biz_uid, v_biz_name, COALESCE(v_role, 'employee');
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_employee_seat(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_employee_seat(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.claim_employee_seat_by_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_employee_seat_by_email() TO authenticated, service_role;