
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS resources_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resource_label text NOT NULL DEFAULT 'Resource',
  ADD COLUMN IF NOT EXISTS party_size_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assignment_mode text NOT NULL DEFAULT 'client_pick'
    CHECK (assignment_mode IN ('client_pick','auto'));

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resources_user_idx ON public.resources(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT SELECT ON public.resources TO anon;
GRANT ALL ON public.resources TO service_role;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage their resources" ON public.resources;
CREATE POLICY "Owners manage their resources"
  ON public.resources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active resources" ON public.resources;
CREATE POLICY "Public can view active resources"
  ON public.resources FOR SELECT
  USING (active = true);

DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS party_size integer;

ALTER TABLE public.pending_bookings
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS party_size integer;

CREATE INDEX IF NOT EXISTS bookings_resource_idx ON public.bookings(resource_id);
CREATE INDEX IF NOT EXISTS pending_bookings_resource_idx ON public.pending_bookings(resource_id);

DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);
CREATE FUNCTION public.get_widget_settings(p_user_id uuid)
 RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text,
               deposit_amount numeric, currency text, timezone text, working_hours jsonb,
               allow_same_day boolean, max_advance_days integer, buffer_minutes integer,
               resources_enabled boolean, resource_label text, party_size_enabled boolean,
               assignment_mode text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT user_id, business_name, welcome_message, accent_color,
         deposit_amount, currency, timezone, working_hours,
         allow_same_day, max_advance_days, buffer_minutes,
         resources_enabled, resource_label, party_size_enabled, assignment_mode
  FROM public.business_settings
  WHERE user_id = p_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_widget_resources(p_user_id uuid)
 RETURNS TABLE(id uuid, name text, capacity integer, sort_order integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT id, name, capacity, sort_order
  FROM public.resources
  WHERE user_id = p_user_id AND active = true
  ORDER BY sort_order, name;
$function$;

DROP FUNCTION IF EXISTS public.get_busy_slots(uuid, date, date);
CREATE FUNCTION public.get_busy_slots(p_user_id uuid, p_from date, p_to date)
 RETURNS TABLE(booking_date date, booking_time time without time zone, duration_minutes integer, status text, resource_id uuid)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT booking_date, booking_time, duration_minutes, status, resource_id
  FROM public.bookings
  WHERE user_id = p_user_id
    AND booking_date BETWEEN p_from AND p_to
    AND status IN ('pending','confirmed');
$function$;
