CREATE OR REPLACE FUNCTION public.get_founding_spots_remaining()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, 100 - (
    SELECT count(*)::int FROM public.business_settings bs
    WHERE NOT public.has_role(bs.user_id, 'admin')
  ));
$$;
REVOKE ALL ON FUNCTION public.get_founding_spots_remaining() FROM public;
GRANT EXECUTE ON FUNCTION public.get_founding_spots_remaining() TO anon, authenticated;