CREATE OR REPLACE FUNCTION public.tier_booking_limit(_tier text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT CASE _tier
    WHEN 'silver'   THEN 100
    WHEN 'gold'     THEN 500
    WHEN 'platinum' THEN NULL
    ELSE 0
  END;
$function$;

CREATE OR REPLACE FUNCTION public.tier_staff_limit(_tier text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT CASE _tier
    WHEN 'silver'   THEN 2
    WHEN 'gold'     THEN 10
    WHEN 'platinum' THEN NULL
    ELSE 0
  END;
$function$;

CREATE OR REPLACE FUNCTION public.tier_fee_percent(_tier text)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT CASE _tier
    WHEN 'silver'   THEN 12.5
    WHEN 'gold'     THEN 5.0
    WHEN 'platinum' THEN 2.0
    ELSE 12.5
  END::numeric;
$function$;

REVOKE ALL ON FUNCTION public.tier_booking_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tier_staff_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tier_fee_percent(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tier_booking_limit(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.tier_staff_limit(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.tier_fee_percent(text) TO service_role;