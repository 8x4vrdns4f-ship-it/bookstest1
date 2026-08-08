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
    AND e.auth_user_id IS NULL
  ORDER BY e.created_at ASC
  LIMIT 1;

  IF v_emp_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.employees SET auth_user_id = v_uid WHERE id = v_emp_id;

  SELECT bs.business_name INTO v_biz_name
  FROM public.business_settings bs WHERE bs.user_id = v_biz_uid;

  SELECT cr.name INTO v_role
  FROM public.employees e
  LEFT JOIN public.company_roles cr ON cr.id = e.role_id
  WHERE e.id = v_emp_id;

  RETURN QUERY SELECT v_emp_id, v_biz_uid, v_biz_name, COALESCE(v_role, 'employee');
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_employee_seat_by_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_employee_seat_by_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_employee_seat_by_email() TO service_role;