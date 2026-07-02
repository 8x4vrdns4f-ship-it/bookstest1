
CREATE OR REPLACE FUNCTION public.get_public_business_info(_user_id uuid)
RETURNS TABLE (
  business_name text,
  business_category text,
  business_address text,
  business_phone text,
  accent_color text,
  welcome_message text,
  cancellation_hours integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_name, business_category, business_address, business_phone,
         accent_color, welcome_message, cancellation_hours
  FROM public.business_settings
  WHERE user_id = _user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_business_info(uuid) TO anon, authenticated;
