CREATE OR REPLACE FUNCTION public.get_owner_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_owner_email(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_email(uuid) TO authenticated, service_role;