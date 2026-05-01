-- 1. Add assigned employee column to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS assigned_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_assigned_employee ON public.bookings(assigned_employee_id);

-- 2. Per-date business hours overrides
CREATE TABLE IF NOT EXISTS public.date_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  override_date date NOT NULL,
  closed boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, override_date)
);

ALTER TABLE public.date_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own date overrides"
  ON public.date_overrides
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read date overrides for widget"
  ON public.date_overrides
  FOR SELECT
  TO anon
  USING (true);

CREATE TRIGGER update_date_overrides_updated_at
  BEFORE UPDATE ON public.date_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Allow employees to update bookings assigned to them (so they can mark in_progress / completed)
CREATE POLICY "Assigned employees can update their bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = bookings.assigned_employee_id
        AND e.auth_user_id = auth.uid()
    )
  );

-- 4. Enable realtime for bookings
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;