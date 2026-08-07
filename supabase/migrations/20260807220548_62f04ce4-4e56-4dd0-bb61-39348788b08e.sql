-- get_active_tier is only consumed server-side (edge functions using the
-- service role) and by other SECURITY DEFINER functions/triggers. It does not
-- need to be callable directly by signed-in users through the Data API.
REVOKE EXECUTE ON FUNCTION public.get_active_tier(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_active_tier(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_active_tier(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_tier(uuid) TO service_role;