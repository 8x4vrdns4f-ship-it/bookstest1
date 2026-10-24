ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS payments_terms_accepted_at timestamptz;
DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);
CREATE FUNCTION public.get_widget_settings(p_user_id uuid)
 RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text, deposit_amount numeric, currency text, timezone text, working_hours jsonb, allow_same_day boolean, max_advance_days integer, buffer_minutes integer, resources_enabled boolean, resource_label text, party_size_enabled boolean, assignment_mode text, waitlist_enabled boolean, services_enabled boolean, payment_mode text, booking_mode text, min_rental_days integer, max_rental_days integer, payments_enabled boolean, show_branding boolean, widget_logo_url text, widget_bg_color text, widget_text_color text, widget_font text, widget_radius text, cancellation_hours integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH t AS (SELECT public.tier_allows(public.get_active_tier(p_user_id), 'custom_branding') AS brand)
  SELECT bs.user_id, bs.business_name, bs.welcome_message,
         CASE WHEN t.brand THEN bs.accent_color ELSE '#4FC3F7' END,
         bs.deposit_amount, bs.currency, bs.timezone, bs.working_hours, bs.allow_same_day, bs.max_advance_days,
         bs.buffer_minutes,
         (bs.resources_enabled AND public.tier_allows(public.get_active_tier(bs.user_id), 'resources')),
         bs.resource_label, bs.party_size_enabled, bs.assignment_mode,
         (bs.waitlist_enabled AND public.tier_allows(public.get_active_tier(bs.user_id), 'waitlist')),
         bs.services_enabled, bs.payment_mode,
         CASE WHEN bs.booking_mode = 'daily' AND NOT public.tier_allows(public.get_active_tier(bs.user_id), 'day_mode')
              THEN 'hourly' ELSE bs.booking_mode END,
         bs.min_rental_days, bs.max_rental_days,
         EXISTS (SELECT 1 FROM public.connect_accounts ca WHERE ca.user_id = bs.user_id AND ca.charges_enabled = true),
         NOT public.tier_allows(public.get_active_tier(bs.user_id), 'remove_branding'),
         CASE WHEN t.brand THEN bs.widget_logo_url ELSE NULL END,
         CASE WHEN t.brand THEN bs.widget_bg_color ELSE '#0F1420' END,
         CASE WHEN t.brand THEN bs.widget_text_color ELSE '#F3F4F6' END,
         CASE WHEN t.brand THEN bs.widget_font ELSE 'Plus Jakarta Sans' END,
         CASE WHEN t.brand THEN bs.widget_radius ELSE 'rounded' END,
         bs.cancellation_hours
  FROM public.business_settings bs, t
  WHERE bs.user_id = p_user_id
$function$;
GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated, service_role;