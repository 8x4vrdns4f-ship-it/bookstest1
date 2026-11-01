CREATE OR REPLACE FUNCTION public.admin_platform_stats()
 RETURNS TABLE(total_users bigint, total_businesses bigint, active_subscriptions bigint, gold_subscriptions bigint, platinum_subscriptions bigint, mrr_estimate numeric, bookings_total bigint, bookings_last_30d bigint, open_messages bigint, gift_codes_total bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized';
  end if;
  return query
  SELECT
    (SELECT count(*) FROM auth.users),
    (SELECT count(*) FROM public.business_settings),
    (SELECT count(*) FROM public.subscriptions s WHERE s.subscribed),
    (SELECT count(*) FROM public.subscriptions s WHERE s.subscribed AND s.tier = 'gold'),
    (SELECT count(*) FROM public.subscriptions s WHERE s.subscribed AND s.tier = 'platinum'),
    (SELECT round(coalesce(sum(
       CASE WHEN s.price_id LIKE '%\_yearly' OR s.price_id IN (
              'price_1UX1lUFXQZu4XzM9N2iGaWgx','price_1UX1lVFXQZu4XzM9IXjBAUGe','price_1UX1lVFXQZu4XzM9MVeXftsB',
              'price_1UX1QYAgQmqIT4C81ogj3g1E','price_1UX1QbAgQmqIT4C8yxSenU6B','price_1UX1QdAgQmqIT4C8D4BMAcXW')
         THEN CASE lower(s.tier) WHEN 'silver' THEN 250 WHEN 'gold' THEN 590 WHEN 'platinum' THEN 1990 ELSE 0 END / 12.0
         ELSE CASE lower(s.tier) WHEN 'silver' THEN 25 WHEN 'gold' THEN 59 WHEN 'platinum' THEN 199 ELSE 0 END
       END), 0)::numeric, 2) FROM public.subscriptions s WHERE s.subscribed),
    (SELECT count(*) FROM public.bookings),
    (SELECT count(*) FROM public.bookings b WHERE b.created_at > now() - interval '30 days'),
    (SELECT count(*) FROM public.contact_messages c WHERE NOT c.handled),
    (SELECT count(*) FROM public.gift_codes);
end;
$function$;