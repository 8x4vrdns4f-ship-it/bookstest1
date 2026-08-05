CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  price numeric,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their services"
ON public.services FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view company services"
ON public.services FOR SELECT TO authenticated
USING (public.has_company_permission(auth.uid(), user_id, 'view_all_bookings'));

CREATE INDEX idx_services_user_active ON public.services (user_id, active, sort_order);

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE public.pending_bookings ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS services_enabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_widget_services(p_user_id uuid)
RETURNS TABLE(id uuid, name text, duration_minutes integer, price numeric, sort_order integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, name, duration_minutes, price, sort_order
  FROM public.services
  WHERE user_id = p_user_id AND active = true
  ORDER BY sort_order, name;
$$;

DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);

CREATE FUNCTION public.get_widget_settings(p_user_id uuid)
RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text, deposit_amount numeric, currency text, timezone text, working_hours jsonb, allow_same_day boolean, max_advance_days integer, buffer_minutes integer, resources_enabled boolean, resource_label text, party_size_enabled boolean, assignment_mode text, waitlist_enabled boolean, services_enabled boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, business_name, welcome_message, accent_color,
         deposit_amount, currency, timezone, working_hours,
         allow_same_day, max_advance_days, buffer_minutes,
         resources_enabled, resource_label, party_size_enabled, assignment_mode,
         waitlist_enabled, services_enabled
  FROM public.business_settings
  WHERE user_id = p_user_id;
$$;