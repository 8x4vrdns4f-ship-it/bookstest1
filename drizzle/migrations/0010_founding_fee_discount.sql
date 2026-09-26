CREATE OR REPLACE FUNCTION public.is_founding_discount_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT created_at FROM public.business_settings WHERE user_id = _user_id LIMIT 1
  )
  SELECT EXISTS (
    SELECT 1 FROM me
    WHERE now() < me.created_at + interval '30 days'
      AND NOT public.has_role(_user_id, 'admin')
      AND (
        SELECT count(*) FROM public.business_settings bs
        WHERE bs.created_at < me.created_at
          AND NOT public.has_role(bs.user_id, 'admin')
      ) < 100
  );
$$;
REVOKE ALL ON FUNCTION public.is_founding_discount_active(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_founding_discount_active(uuid) TO authenticated, service_role;