-- Shifts: which employees are working on a given day
CREATE TABLE public.employee_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  shift_date date NOT NULL,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, shift_date)
);

CREATE INDEX idx_employee_shifts_user_date ON public.employee_shifts(user_id, shift_date);

ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own shifts"
ON public.employee_shifts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employee can view own shifts"
ON public.employee_shifts FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_shifts.employee_id AND e.auth_user_id = auth.uid()
));

CREATE TRIGGER update_employee_shifts_updated_at
BEFORE UPDATE ON public.employee_shifts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Manual status override on employees (applies only when manual_status_date = today)
ALTER TABLE public.employees
  ADD COLUMN manual_status text,
  ADD COLUMN manual_status_date date,
  ADD CONSTRAINT employees_manual_status_check
    CHECK (manual_status IS NULL OR manual_status IN ('free','unavailable'));