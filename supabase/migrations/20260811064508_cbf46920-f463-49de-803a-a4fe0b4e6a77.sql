-- 1. Time off requests
CREATE TABLE public.time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_off_requests TO authenticated;
GRANT ALL ON public.time_off_requests TO service_role;

ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own time off"
ON public.time_off_requests FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.auth_user_id = auth.uid())
  OR public.has_company_permission(auth.uid(), user_id, 'approve_requests')
);

CREATE POLICY "Employees create own time off"
ON public.time_off_requests FOR INSERT TO authenticated
WITH CHECK (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_id AND e.auth_user_id = auth.uid() AND e.user_id = time_off_requests.user_id
  )
);

CREATE POLICY "Approvers decide time off"
ON public.time_off_requests FOR UPDATE TO authenticated
USING (public.has_company_permission(auth.uid(), user_id, 'approve_requests'))
WITH CHECK (public.has_company_permission(auth.uid(), user_id, 'approve_requests'));

CREATE POLICY "Employees cancel own pending time off"
ON public.time_off_requests FOR DELETE TO authenticated
USING (
  status = 'pending'
  AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.auth_user_id = auth.uid())
);

CREATE TRIGGER time_off_requests_updated_at
BEFORE UPDATE ON public.time_off_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_time_off_employee ON public.time_off_requests(employee_id, start_date);
CREATE INDEX idx_time_off_business ON public.time_off_requests(user_id, status);

-- 2. Employee notifications
CREATE TABLE public.employee_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  booking_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.employee_notifications TO authenticated;
GRANT ALL ON public.employee_notifications TO service_role;

ALTER TABLE public.employee_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own notifications"
ON public.employee_notifications FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.auth_user_id = auth.uid())
  OR auth.uid() = user_id
);

CREATE POLICY "Employees mark own notifications read"
ON public.employee_notifications FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.auth_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.auth_user_id = auth.uid()));

CREATE POLICY "Employees delete own notifications"
ON public.employee_notifications FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.auth_user_id = auth.uid()));

CREATE INDEX idx_emp_notifications ON public.employee_notifications(employee_id, created_at DESC);

-- 3. Booking triggers that create notifications
CREATE OR REPLACE FUNCTION public.notify_employee_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_employee_id IS NOT NULL THEN
      INSERT INTO public.employee_notifications (user_id, employee_id, type, title, body, booking_id)
      VALUES (NEW.user_id, NEW.assigned_employee_id, 'assigned', 'New appointment assigned',
        NEW.client_name || ' · ' || NEW.service || ' · ' || to_char(NEW.booking_date, 'DD Mon') || ' ' || to_char(NEW.booking_time, 'HH24:MI'),
        NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id THEN
    IF NEW.assigned_employee_id IS NOT NULL THEN
      INSERT INTO public.employee_notifications (user_id, employee_id, type, title, body, booking_id)
      VALUES (NEW.user_id, NEW.assigned_employee_id, 'assigned', 'New appointment assigned',
        NEW.client_name || ' · ' || NEW.service || ' · ' || to_char(NEW.booking_date, 'DD Mon') || ' ' || to_char(NEW.booking_time, 'HH24:MI'),
        NEW.id);
    END IF;
    IF OLD.assigned_employee_id IS NOT NULL THEN
      INSERT INTO public.employee_notifications (user_id, employee_id, type, title, body, booking_id)
      VALUES (OLD.user_id, OLD.assigned_employee_id, 'unassigned', 'Appointment reassigned',
        OLD.client_name || ' · ' || to_char(OLD.booking_date, 'DD Mon') || ' ' || to_char(OLD.booking_time, 'HH24:MI') || ' is no longer yours',
        OLD.id);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.assigned_employee_id IS NOT NULL
     AND (NEW.booking_date IS DISTINCT FROM OLD.booking_date OR NEW.booking_time IS DISTINCT FROM OLD.booking_time) THEN
    INSERT INTO public.employee_notifications (user_id, employee_id, type, title, body, booking_id)
    VALUES (NEW.user_id, NEW.assigned_employee_id, 'rescheduled', 'Appointment moved',
      NEW.client_name || ' is now ' || to_char(NEW.booking_date, 'DD Mon') || ' ' || to_char(NEW.booking_time, 'HH24:MI'),
      NEW.id);
  END IF;

  IF NEW.assigned_employee_id IS NOT NULL
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('cancelled', 'declined') THEN
    INSERT INTO public.employee_notifications (user_id, employee_id, type, title, body, booking_id)
    VALUES (NEW.user_id, NEW.assigned_employee_id, 'cancelled', 'Appointment cancelled',
      NEW.client_name || ' · ' || to_char(NEW.booking_date, 'DD Mon') || ' ' || to_char(NEW.booking_time, 'HH24:MI'),
      NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_employee_booking_change
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_employee_booking_change();

-- 4. Time-off decision notification
CREATE OR REPLACE FUNCTION public.notify_employee_time_off_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'declined') THEN
    INSERT INTO public.employee_notifications (user_id, employee_id, type, title, body)
    VALUES (
      NEW.user_id, NEW.employee_id, 'time_off',
      CASE WHEN NEW.status = 'approved' THEN 'Time off approved' ELSE 'Time off declined' END,
      to_char(NEW.start_date, 'DD Mon') || ' – ' || to_char(NEW.end_date, 'DD Mon')
        || COALESCE(': ' || NEW.decision_note, '')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_time_off_decision
AFTER UPDATE ON public.time_off_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_employee_time_off_decision();

-- 5. Realtime
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.employee_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.time_off_requests REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.time_off_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
