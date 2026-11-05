REVOKE EXECUTE ON FUNCTION public.check_in_by_code(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_by_code(text, text) TO service_role;
GRANT SELECT ON public.rate_limits TO service_role;