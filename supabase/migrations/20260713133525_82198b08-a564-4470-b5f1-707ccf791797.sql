ALTER FUNCTION public.generate_gift_code() SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.generate_gift_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_gift_code() FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_gift_code() TO authenticated;