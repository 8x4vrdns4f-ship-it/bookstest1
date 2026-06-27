
-- 1) Revoke PUBLIC EXECUTE on SECURITY DEFINER functions exposed via PostgREST
REVOKE EXECUTE ON FUNCTION public.check_in_by_code(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_gift_code(text) FROM PUBLIC;
-- Keep authenticated-only grants (already present); ensure anon cannot call them
REVOKE EXECUTE ON FUNCTION public.check_in_by_code(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_gift_code(text) FROM anon;

-- 2) employee_join_requests: add WITH CHECK preventing approvers from rewriting identity/ownership fields
DROP POLICY IF EXISTS "Approvers can update company requests" ON public.employee_join_requests;
CREATE POLICY "Approvers can update company requests"
ON public.employee_join_requests
FOR UPDATE
USING (public.has_company_permission(auth.uid(), user_id, 'approve_requests'))
WITH CHECK (public.has_company_permission(auth.uid(), user_id, 'approve_requests'));

CREATE OR REPLACE FUNCTION public.guard_employee_join_requests_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.requester_auth_id IS DISTINCT FROM OLD.requester_auth_id
     OR NEW.requester_email IS DISTINCT FROM OLD.requester_email
     OR NEW.requester_name IS DISTINCT FROM OLD.requester_name
     OR NEW.requester_phone IS DISTINCT FROM OLD.requester_phone
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Approvers cannot modify requester identity or ownership fields on join requests';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_employee_join_requests_update ON public.employee_join_requests;
CREATE TRIGGER guard_employee_join_requests_update
BEFORE UPDATE ON public.employee_join_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_employee_join_requests_update();

-- 3) employees: add WITH CHECK on owner update, and guard owner from hijacking auth_user_id linkage
DROP POLICY IF EXISTS "Users can update their own employees" ON public.employees;
CREATE POLICY "Users can update their own employees"
ON public.employees
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.guard_employees_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when the business owner is performing the update
  IF auth.uid() = NEW.user_id THEN
    -- Owners may clear an auth link (revoke access) but cannot reassign it to a different account.
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
       AND NEW.auth_user_id IS NOT NULL
       AND OLD.auth_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'Owners cannot reassign an employee auth_user_id to a different account';
    END IF;
    -- If linking to a new auth account, require it to actually exist
    IF NEW.auth_user_id IS NOT NULL
       AND NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
       AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.auth_user_id) THEN
      RAISE EXCEPTION 'auth_user_id must reference an existing user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_employees_owner_update ON public.employees;
CREATE TRIGGER guard_employees_owner_update
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.guard_employees_owner_update();
