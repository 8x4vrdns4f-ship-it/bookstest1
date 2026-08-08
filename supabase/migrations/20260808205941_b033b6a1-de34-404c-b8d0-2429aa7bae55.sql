GRANT EXECUTE ON FUNCTION public.generate_company_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_booking_code() TO anon, authenticated, service_role;