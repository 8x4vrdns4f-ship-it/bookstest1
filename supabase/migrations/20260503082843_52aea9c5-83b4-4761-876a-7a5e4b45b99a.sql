-- Allow a signed-in user to find and link the employee row that matches their own email
CREATE POLICY "Users can view employee row matching their email"
ON public.employees
FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Users can link employee row matching their email"
ON public.employees
FOR UPDATE
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email')) AND auth_user_id IS NULL)
WITH CHECK (lower(email) = lower((auth.jwt() ->> 'email')) AND auth_user_id = auth.uid());