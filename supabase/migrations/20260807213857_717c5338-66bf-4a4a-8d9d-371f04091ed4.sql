DROP POLICY IF EXISTS "Public can view active resources" ON public.resources;
REVOKE SELECT ON public.resources FROM anon;