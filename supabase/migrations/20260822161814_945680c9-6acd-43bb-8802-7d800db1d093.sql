DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);

CREATE OR REPLACE FUNCTION public.get_widget_settings(p_user_id uuid)
 RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text, deposit_amount numeric, currency text, timezone text, working_hours jsonb, allow_same_day boolean, max_advance_days integer, buffer_minutes integer, resources_enabled boolean, resource_label text, party_size_enabled boolean, assignment_mode text, waitlist_enabled boolean, services_enabled boolean, payment_mode text, booking_mode text, min_rental_days integer, max_rental_days integer, payments_enabled boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT bs.user_id, bs.business_name, bs.welcome_message, bs.accent_color, bs.deposit_amount,
         bs.currency, bs.timezone, bs.working_hours, bs.allow_same_day, bs.max_advance_days,
         bs.buffer_minutes, bs.resources_enabled, bs.resource_label, bs.party_size_enabled,
         bs.assignment_mode, bs.waitlist_enabled, bs.services_enabled, bs.payment_mode,
         bs.booking_mode, bs.min_rental_days, bs.max_rental_days,
         EXISTS (
           SELECT 1 FROM public.connect_accounts ca
           WHERE ca.user_id = bs.user_id AND ca.charges_enabled = true
         ) AS payments_enabled
  FROM public.business_settings bs
  WHERE bs.user_id = p_user_id
$function$;

REVOKE ALL ON FUNCTION public.get_widget_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated;