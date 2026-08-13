CREATE OR REPLACE FUNCTION public.can_create_gift_code()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.subscribed = true
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_create_gift_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_create_gift_code() FROM anon;
GRANT EXECUTE ON FUNCTION public.can_create_gift_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_gift_code() TO service_role;

DROP POLICY IF EXISTS "Subscribers can create gift codes" ON public.gift_codes;
CREATE POLICY "Subscribers can create gift codes"
ON public.gift_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by AND public.can_create_gift_code());