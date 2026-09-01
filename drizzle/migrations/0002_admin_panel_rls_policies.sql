-- Admin panel access: platform-owner RLS policies using has_role(auth.uid(), 'admin')
-- Drop-and-recreate for idempotency (a prior partial attempt may exist)

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all business settings" ON public.business_settings;
CREATE POLICY "Admins can view all business settings"
ON public.business_settings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
CREATE POLICY "Admins can view all employees"
ON public.employees FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view email send log" ON public.email_send_log;
CREATE POLICY "Admins can view email send log"
ON public.email_send_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view gift codes" ON public.gift_codes;
CREATE POLICY "Admins can view gift codes"
ON public.gift_codes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create gift codes" ON public.gift_codes;
CREATE POLICY "Admins can create gift codes"
ON public.gift_codes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update gift codes" ON public.gift_codes;
CREATE POLICY "Admins can update gift codes"
ON public.gift_codes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));