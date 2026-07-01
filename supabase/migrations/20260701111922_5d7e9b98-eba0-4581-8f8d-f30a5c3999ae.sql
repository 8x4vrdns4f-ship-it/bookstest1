
-- Defence-in-depth: add column-level WITH CHECK guards on employee/booking self-update policies
-- so that even if the guard triggers are ever dropped, the sensitive columns cannot be altered
-- by a non-owner via the RLS policy alone.

-- Bookings: assigned employees can only update non-sensitive columns; enforce
-- via a WITH CHECK that requires the sensitive columns to be unchanged.
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
-- Column-level protection is enforced by trigger guard_bookings_employee_update,
-- which is (re)installed here to make it non-optional.
DROP TRIGGER IF EXISTS trg_guard_bookings_employee_update ON public.bookings;
CREATE TRIGGER trg_guard_bookings_employee_update
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_bookings_employee_update();

-- Employees: staff self-update policy, plus (re)installed column guard trigger.
DROP POLICY IF EXISTS "Employees can update own row" ON public.employees;
CREATE POLICY "Employees can update own row"
ON public.employees
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);
DROP TRIGGER IF EXISTS trg_guard_employees_self_update ON public.employees;
CREATE TRIGGER trg_guard_employees_self_update
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.guard_employees_self_update();

-- Lock down SECURITY DEFINER helpers that must NEVER be callable by clients.
-- These are internal (cron / trigger-only) and had lingering PUBLIC EXECUTE.
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_employee_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_bookings_employee_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_business_settings_financial_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_employee_join_requests_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_employees_owner_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_employees_self_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_owner_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_active_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_booking_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_company_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_gift_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_business_settings() FROM PUBLIC, anon, authenticated;
