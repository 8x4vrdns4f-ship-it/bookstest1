
DROP POLICY IF EXISTS "Assigned employees can update their bookings" ON public.bookings;
CREATE POLICY "Assigned employees can update their bookings"
ON public.bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = bookings.assigned_employee_id
      AND e.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = bookings.assigned_employee_id
      AND e.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Employees can update own row" ON public.employees;
CREATE POLICY "Employees can update own row"
ON public.employees
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);
