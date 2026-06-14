
DROP POLICY IF EXISTS "Employees can view company bookings" ON public.bookings;

CREATE POLICY "Employees can view permitted bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.auth_user_id = auth.uid()
        AND e.user_id = bookings.user_id
        AND (
          bookings.assigned_employee_id = e.id
          OR public.has_company_permission(auth.uid(), bookings.user_id, 'view_all_bookings')
        )
    )
  );
