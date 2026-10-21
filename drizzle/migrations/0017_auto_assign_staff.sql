ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS default_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS auto_assign_mode text NOT NULL DEFAULT 'off';

CREATE TABLE public.service_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_employees TO authenticated;
GRANT ALL ON public.service_employees TO service_role;
ALTER TABLE public.service_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or managers manage service staff" ON public.service_employees FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_company_permission(auth.uid(), user_id, 'can_manage_settings'))
  WITH CHECK (auth.uid() = user_id OR public.has_company_permission(auth.uid(), user_id, 'can_manage_settings'));
CREATE POLICY "Employees read own service links" ON public.service_employees FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.auth_user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_business_settings()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.deposit_amount < 10 THEN RAISE EXCEPTION 'Deposit amount must be at least £10'; END IF;
  IF NEW.day_start_hour < 0 OR NEW.day_start_hour > 23 THEN RAISE EXCEPTION 'day_start_hour must be 0-23'; END IF;
  IF NEW.day_end_hour < 1 OR NEW.day_end_hour > 24 THEN RAISE EXCEPTION 'day_end_hour must be 1-24'; END IF;
  IF NEW.day_end_hour <= NEW.day_start_hour THEN RAISE EXCEPTION 'day_end_hour must be greater than day_start_hour'; END IF;
  IF NEW.pending_request_ttl_hours < 1 OR NEW.pending_request_ttl_hours > 168 THEN RAISE EXCEPTION 'pending_request_ttl_hours must be between 1 and 168'; END IF;
  IF NEW.auto_assign_mode NOT IN ('off','resource','service') THEN RAISE EXCEPTION 'auto_assign_mode must be off, resource or service'; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.employee_available_at(_employee_id uuid, _date date, _time time, _minutes integer)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_shifts s
    WHERE s.employee_id = _employee_id AND s.shift_date = _date
      AND s.start_time <= _time AND s.end_time >= (_time + make_interval(mins => COALESCE(_minutes,0)))::time
  ) AND NOT EXISTS (
    SELECT 1 FROM public.time_off_requests t
    WHERE t.employee_id = _employee_id AND t.status = 'approved' AND _date BETWEEN t.start_date AND t.end_date
  )
$$;

CREATE OR REPLACE FUNCTION public.auto_assign_booking()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _mode text; _emp uuid;
BEGIN
  IF NEW.assigned_employee_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT auto_assign_mode INTO _mode FROM public.business_settings WHERE user_id = NEW.user_id;
  IF _mode = 'resource' AND NEW.resource_id IS NOT NULL THEN
    SELECT r.default_employee_id INTO _emp FROM public.resources r
     WHERE r.id = NEW.resource_id AND r.user_id = NEW.user_id;
    IF _emp IS NOT NULL AND public.employee_available_at(_emp, NEW.booking_date, NEW.booking_time, NEW.duration_minutes) THEN
      NEW.assigned_employee_id := _emp;
    END IF;
  ELSIF _mode = 'service' AND NEW.service_id IS NOT NULL THEN
    SELECT se.employee_id INTO _emp FROM public.service_employees se
     WHERE se.service_id = NEW.service_id AND se.user_id = NEW.user_id
       AND public.employee_available_at(se.employee_id, NEW.booking_date, NEW.booking_time, NEW.duration_minutes)
     ORDER BY (SELECT count(*) FROM public.bookings b WHERE b.assigned_employee_id = se.employee_id
                 AND b.booking_date = NEW.booking_date AND b.status NOT IN ('cancelled','declined')), se.created_at
     LIMIT 1;
    IF _emp IS NOT NULL THEN NEW.assigned_employee_id := _emp; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_assign_booking_trg ON public.bookings;
CREATE TRIGGER auto_assign_booking_trg BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_booking();