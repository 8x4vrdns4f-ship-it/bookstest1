DROP FUNCTION IF EXISTS public.get_public_business_info(uuid);

CREATE OR REPLACE FUNCTION public.get_public_business_info(_user_id uuid)
 RETURNS TABLE(business_name text, business_category text, business_address text, business_phone text, accent_color text, welcome_message text, cancellation_hours integer, average_rating numeric, review_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT bs.business_name, bs.business_category, bs.business_address, bs.business_phone,
         bs.accent_color, bs.welcome_message, bs.cancellation_hours,
         COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
         COALESCE(COUNT(r.id), 0)::int AS review_count
  FROM public.business_settings bs
  LEFT JOIN public.reviews r ON r.user_id = bs.user_id
  WHERE bs.user_id = _user_id
  GROUP BY bs.business_name, bs.business_category, bs.business_address, bs.business_phone,
           bs.accent_color, bs.welcome_message, bs.cancellation_hours
  LIMIT 1;
$function$;