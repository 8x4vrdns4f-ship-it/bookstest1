CREATE OR REPLACE FUNCTION public.release_promo_code_use(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promo_codes
     SET times_used = GREATEST(times_used - 1, 0)
   WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.release_promo_code_use(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_promo_code_use(uuid) TO service_role;