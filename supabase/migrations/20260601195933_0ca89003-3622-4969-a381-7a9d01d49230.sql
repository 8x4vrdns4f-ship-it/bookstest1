
-- =========================================================
-- company_roles
-- =========================================================
CREATE TABLE public.company_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- business owner
  name text NOT NULL,
  is_builtin boolean NOT NULL DEFAULT false,
  can_approve_requests boolean NOT NULL DEFAULT false,
  can_view_all_bookings boolean NOT NULL DEFAULT false,
  can_check_in boolean NOT NULL DEFAULT false,
  can_manage_settings boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_roles TO authenticated;
GRANT ALL ON public.company_roles TO service_role;

ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own roles"
  ON public.company_roles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employees can view their company roles"
  ON public.company_roles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.auth_user_id = auth.uid() AND e.user_id = company_roles.user_id
  ));

CREATE TRIGGER trg_company_roles_updated
  BEFORE UPDATE ON public.company_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed built-in roles for every existing business
INSERT INTO public.company_roles (user_id, name, is_builtin, can_approve_requests, can_view_all_bookings, can_check_in, can_manage_settings)
SELECT user_id, 'owner',        true, true,  true,  true,  true  FROM public.business_settings
UNION ALL
SELECT user_id, 'manager',      true, true,  true,  true,  false FROM public.business_settings
UNION ALL
SELECT user_id, 'receptionist', true, false, true,  true,  false FROM public.business_settings
UNION ALL
SELECT user_id, 'employee',     true, false, false, false, false FROM public.business_settings
ON CONFLICT (user_id, name) DO NOTHING;

-- =========================================================
-- employees.role_id
-- =========================================================
ALTER TABLE public.employees
  ADD COLUMN role_id uuid REFERENCES public.company_roles(id) ON DELETE SET NULL,
  ADD COLUMN available_now boolean NOT NULL DEFAULT false;

-- Backfill existing employees to the 'employee' role for their business
UPDATE public.employees e
SET role_id = cr.id
FROM public.company_roles cr
WHERE cr.user_id = e.user_id AND cr.name = 'employee' AND e.role_id IS NULL;

-- =========================================================
-- has_company_permission helper (SECURITY DEFINER, no recursion)
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_company_permission(
  _auth_uid uuid,
  _business_user_id uuid,
  _perm text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    -- owner of the business always passes
    (_auth_uid = _business_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.employees e
      JOIN public.company_roles cr ON cr.id = e.role_id
      WHERE e.auth_user_id = _auth_uid
        AND e.user_id = _business_user_id
        AND (
          (_perm = 'approve_requests'   AND cr.can_approve_requests)
       OR (_perm = 'view_all_bookings'  AND cr.can_view_all_bookings)
       OR (_perm = 'check_in'           AND cr.can_check_in)
       OR (_perm = 'manage_settings'    AND cr.can_manage_settings)
        )
    );
$$;

-- =========================================================
-- employee_join_requests
-- =========================================================
CREATE TABLE public.employee_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- business owner
  requester_auth_id uuid NOT NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_phone text,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  decline_reason text,
  assigned_role_id uuid REFERENCES public.company_roles(id) ON DELETE SET NULL,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_join_requests_business ON public.employee_join_requests(user_id, status);
CREATE INDEX idx_join_requests_requester ON public.employee_join_requests(requester_auth_id);

GRANT SELECT, INSERT, UPDATE ON public.employee_join_requests TO authenticated;
GRANT ALL ON public.employee_join_requests TO service_role;

ALTER TABLE public.employee_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester can view own requests"
  ON public.employee_join_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_auth_id);

CREATE POLICY "Approvers can view company requests"
  ON public.employee_join_requests
  FOR SELECT TO authenticated
  USING (public.has_company_permission(auth.uid(), user_id, 'approve_requests'));

CREATE POLICY "Approvers can update company requests"
  ON public.employee_join_requests
  FOR UPDATE TO authenticated
  USING (public.has_company_permission(auth.uid(), user_id, 'approve_requests'));

CREATE TRIGGER trg_join_requests_updated
  BEFORE UPDATE ON public.employee_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- RPC: request_to_join_company
-- =========================================================
CREATE OR REPLACE FUNCTION public.request_to_join_company(
  p_company_code text,
  p_name text,
  p_phone text
) RETURNS TABLE(request_id uuid, business_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_business_user_id uuid;
  v_business_name text;
  v_request_id uuid;
BEGIN
  IF v_uid IS NULL OR v_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT bs.user_id, bs.business_name INTO v_business_user_id, v_business_name
  FROM public.business_settings bs
  WHERE bs.company_code = upper(p_company_code)
  LIMIT 1;
  IF v_business_user_id IS NULL THEN
    RAISE EXCEPTION 'Company code not found';
  END IF;

  -- Already linked? Don't create duplicate request.
  IF EXISTS (SELECT 1 FROM public.employees WHERE auth_user_id = v_uid AND user_id = v_business_user_id) THEN
    RAISE EXCEPTION 'You are already a member of this company';
  END IF;

  -- Reuse existing pending request if any
  SELECT id INTO v_request_id FROM public.employee_join_requests
  WHERE requester_auth_id = v_uid AND user_id = v_business_user_id AND status = 'pending';

  IF v_request_id IS NULL THEN
    INSERT INTO public.employee_join_requests (user_id, requester_auth_id, requester_name, requester_email, requester_phone)
    VALUES (v_business_user_id, v_uid, p_name, v_email, p_phone)
    RETURNING id INTO v_request_id;
  ELSE
    UPDATE public.employee_join_requests
       SET requester_name = p_name, requester_phone = p_phone, updated_at = now()
     WHERE id = v_request_id;
  END IF;

  RETURN QUERY SELECT v_request_id, v_business_name;
END;
$$;

-- =========================================================
-- RPC: decide_join_request (accept or decline)
-- =========================================================
CREATE OR REPLACE FUNCTION public.decide_join_request(
  p_request_id uuid,
  p_decision text,        -- 'accept' or 'decline'
  p_role_id uuid,         -- required when accepting
  p_decline_reason text   -- required when declining
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.employee_join_requests%ROWTYPE;
  v_role public.company_roles%ROWTYPE;
  v_emp_id uuid;
BEGIN
  SELECT * INTO v_req FROM public.employee_join_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already %', v_req.status;
  END IF;
  IF NOT public.has_company_permission(auth.uid(), v_req.user_id, 'approve_requests') THEN
    RAISE EXCEPTION 'Not authorized to decide requests';
  END IF;

  IF p_decision = 'accept' THEN
    IF p_role_id IS NULL THEN
      RAISE EXCEPTION 'Role is required when accepting';
    END IF;
    SELECT * INTO v_role FROM public.company_roles WHERE id = p_role_id AND user_id = v_req.user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Role not found for this company';
    END IF;

    -- Insert or update employee row
    SELECT id INTO v_emp_id FROM public.employees
     WHERE user_id = v_req.user_id AND lower(email) = lower(v_req.requester_email);

    IF v_emp_id IS NULL THEN
      INSERT INTO public.employees (user_id, name, email, phone, auth_user_id, role_id)
      VALUES (v_req.user_id, v_req.requester_name, v_req.requester_email, v_req.requester_phone, v_req.requester_auth_id, p_role_id);
    ELSE
      UPDATE public.employees
         SET auth_user_id = v_req.requester_auth_id,
             role_id = p_role_id,
             name = COALESCE(name, v_req.requester_name),
             phone = COALESCE(phone, v_req.requester_phone)
       WHERE id = v_emp_id;
    END IF;

    UPDATE public.employee_join_requests
       SET status = 'accepted', assigned_role_id = p_role_id, decided_by = auth.uid(), decided_at = now()
     WHERE id = p_request_id;

  ELSIF p_decision = 'decline' THEN
    IF p_decline_reason IS NULL OR length(trim(p_decline_reason)) = 0 THEN
      RAISE EXCEPTION 'A reason is required when declining';
    END IF;
    UPDATE public.employee_join_requests
       SET status = 'declined', decline_reason = p_decline_reason, decided_by = auth.uid(), decided_at = now()
     WHERE id = p_request_id;
  ELSE
    RAISE EXCEPTION 'Unknown decision: %', p_decision;
  END IF;
END;
$$;

-- =========================================================
-- handle_new_user: seed built-in roles for new businesses
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  IF (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'employee' THEN
    INSERT INTO public.business_settings (user_id, business_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'display_name', 'My Business'))
    ON CONFLICT (user_id) DO NOTHING;

    -- Seed built-in roles for the new business
    INSERT INTO public.company_roles (user_id, name, is_builtin, can_approve_requests, can_view_all_bookings, can_check_in, can_manage_settings)
    VALUES
      (NEW.id, 'owner',        true, true,  true,  true,  true),
      (NEW.id, 'manager',      true, true,  true,  true,  false),
      (NEW.id, 'receptionist', true, false, true,  true,  false),
      (NEW.id, 'employee',     true, false, false, false, false)
    ON CONFLICT (user_id, name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_join_requests;
