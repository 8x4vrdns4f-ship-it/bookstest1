ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'deposit';

ALTER TABLE public.business_settings
  DROP CONSTRAINT IF EXISTS business_settings_payment_mode_check;
ALTER TABLE public.business_settings
  ADD CONSTRAINT business_settings_payment_mode_check
  CHECK (payment_mode IN ('deposit','full','client_choice'));

ALTER TABLE public.pending_bookings
  ADD COLUMN IF NOT EXISTS payment_option text NOT NULL DEFAULT 'deposit',
  ADD COLUMN IF NOT EXISTS service_price numeric,
  ADD COLUMN IF NOT EXISTS charge_amount numeric;

ALTER TABLE public.pending_bookings
  DROP CONSTRAINT IF EXISTS pending_bookings_payment_option_check;
ALTER TABLE public.pending_bookings
  ADD CONSTRAINT pending_bookings_payment_option_check
  CHECK (payment_option IN ('deposit','full'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_option text NOT NULL DEFAULT 'deposit',
  ADD COLUMN IF NOT EXISTS service_price numeric,
  ADD COLUMN IF NOT EXISTS charge_amount numeric;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_option_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_option_check
  CHECK (payment_option IN ('deposit','full'));

DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);
CREATE FUNCTION public.get_widget_settings(p_user_id uuid)
RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text, deposit_amount numeric, currency text, timezone text, working_hours jsonb, allow_same_day boolean, max_advance_days integer, buffer_minutes integer, resources_enabled boolean, resource_label text, party_size_enabled boolean, assignment_mode text, waitlist_enabled boolean, services_enabled boolean, payment_mode text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT user_id, business_name, welcome_message, accent_color,
         deposit_amount, currency, timezone, working_hours,
         allow_same_day, max_advance_days, buffer_minutes,
         resources_enabled, resource_label, party_size_enabled, assignment_mode,
         waitlist_enabled, services_enabled, payment_mode
  FROM public.business_settings
  WHERE user_id = p_user_id;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_widget_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated, service_role;