
-- 1) Bookings: replace permissive anon INSERT policy with a constrained one
DROP POLICY IF EXISTS "Allow public booking inserts via widget" ON public.bookings;

CREATE POLICY "Allow public booking inserts via widget"
ON public.bookings
FOR INSERT
TO anon
WITH CHECK (
  status = 'pending'
  AND payment_status = 'unpaid'
  AND confirmation_code IS NULL
  AND assigned_employee_id IS NULL
  AND EXISTS (SELECT 1 FROM public.business_settings bs WHERE bs.user_id = bookings.user_id)
);

-- 2) employee_join_requests: explicit INSERT policy
DROP POLICY IF EXISTS "Authenticated users can submit own join request" ON public.employee_join_requests;

CREATE POLICY "Authenticated users can submit own join request"
ON public.employee_join_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requester_auth_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.business_settings bs WHERE bs.user_id = employee_join_requests.user_id)
);

-- 3) Set fixed search_path on remaining functions
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_catalog;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_catalog;
