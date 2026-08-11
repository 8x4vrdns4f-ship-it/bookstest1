ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS booking_mode text NOT NULL DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS min_rental_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_rental_days integer NOT NULL DEFAULT 30;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS rental_days integer;

ALTER TABLE public.pending_bookings
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS rental_days integer;

DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);
CREATE FUNCTION public.get_widget_settings(p_user_id uuid)
RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text, deposit_amount numeric, currency text, timezone text, working_hours jsonb, allow_same_day boolean, max_advance_days integer, buffer_minutes integer, resources_enabled boolean, resource_label text, party_size_enabled boolean, assignment_mode text, waitlist_enabled boolean, services_enabled boolean, payment_mode text, booking_mode text, min_rental_days integer, max_rental_days integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bs.user_id, bs.business_name, bs.welcome_message, bs.accent_color, bs.deposit_amount,
         bs.currency, bs.timezone, bs.working_hours, bs.allow_same_day, bs.max_advance_days,
         bs.buffer_minutes, bs.resources_enabled, bs.resource_label, bs.party_size_enabled,
         bs.assignment_mode, bs.waitlist_enabled, bs.services_enabled, bs.payment_mode,
         bs.booking_mode, bs.min_rental_days, bs.max_rental_days
  FROM public.business_settings bs
  WHERE bs.user_id = p_user_id
$$;

REVOKE ALL ON FUNCTION public.get_widget_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_busy_slots(uuid, date, date);
CREATE FUNCTION public.get_busy_slots(p_user_id uuid, p_from date, p_to date)
RETURNS TABLE(booking_date date, booking_time time without time zone, duration_minutes integer, status text, resource_id uuid, end_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.booking_date, b.booking_time, b.duration_minutes, b.status, b.resource_id, b.end_date
  FROM public.bookings b
  WHERE b.user_id = p_user_id
    AND b.status IN ('pending','confirmed')
    AND COALESCE(b.end_date, b.booking_date) >= p_from
    AND b.booking_date <= p_to
$$;

REVOKE ALL ON FUNCTION public.get_busy_slots(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date, date) TO anon, authenticated, service_role;