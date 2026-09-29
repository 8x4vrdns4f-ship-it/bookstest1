CREATE TABLE public.employee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  weekdays int[] NOT NULL DEFAULT '{1,2,3,4,5}',
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_schedules TO authenticated;
GRANT ALL ON public.employee_schedules TO service_role;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages schedules" ON public.employee_schedules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employee views own schedule" ON public.employee_schedules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_schedules.employee_id AND e.auth_user_id = auth.uid()));
CREATE TRIGGER update_employee_schedules_updated_at BEFORE UPDATE ON public.employee_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.employee_shift_skips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skip_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, skip_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_shift_skips TO authenticated;
GRANT ALL ON public.employee_shift_skips TO service_role;
ALTER TABLE public.employee_shift_skips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages skips" ON public.employee_shift_skips FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.employee_shifts ADD COLUMN is_override boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.apply_employee_schedule(_employee_id uuid, _from date DEFAULT CURRENT_DATE, _replace boolean DEFAULT true)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.employee_schedules; v_start date; v_end date := CURRENT_DATE + 84; n integer;
BEGIN
  SELECT * INTO s FROM public.employee_schedules WHERE employee_id = _employee_id;
  IF auth.uid() IS NOT NULL AND NOT public.has_company_permission(auth.uid(),
       COALESCE(s.user_id, (SELECT user_id FROM public.employees WHERE id = _employee_id)), 'manage_settings') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF _replace THEN
    DELETE FROM public.employee_shifts WHERE employee_id = _employee_id AND shift_date >= GREATEST(_from, CURRENT_DATE) AND NOT is_override;
  END IF;
  IF s.id IS NULL THEN RETURN 0; END IF;
  v_start := GREATEST(_from, s.effective_from, CURRENT_DATE);
  INSERT INTO public.employee_shifts (user_id, employee_id, shift_date, start_time, end_time, is_override)
  SELECT s.user_id, s.employee_id, d::date, s.start_time, s.end_time, false
  FROM generate_series(v_start, v_end, interval '1 day') d
  WHERE EXTRACT(DOW FROM d)::int = ANY(s.weekdays)
    AND NOT EXISTS (SELECT 1 FROM public.employee_shift_skips k WHERE k.employee_id = s.employee_id AND k.skip_date = d::date)
  ON CONFLICT (employee_id, shift_date) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.extend_business_schedules(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.has_company_permission(auth.uid(), _user_id, 'manage_settings') THEN RETURN; END IF;
  FOR r IN SELECT employee_id FROM public.employee_schedules WHERE user_id = _user_id LOOP
    PERFORM public.apply_employee_schedule(r.employee_id, CURRENT_DATE, false);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.apply_employee_schedule(uuid, date, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.extend_business_schedules(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_employee_schedule(uuid, date, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.extend_business_schedules(uuid) TO authenticated, service_role;