CREATE OR REPLACE FUNCTION public.admin_list_bookings(p_limit integer DEFAULT 200)
RETURNS TABLE(booking_id uuid, business_user_id uuid, business_name text, client_name text, client_email text, service text, booking_date date, booking_time time without time zone, status text, payment_status text, charge_amount numeric, platform_fee_amount numeric, created_at timestamp with time zone)
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
    b.id,
    b.user_id,
    bs.business_name,
    b.client_name,
    b.client_email,
    b.service,
    b.booking_date,
    b.booking_time,
    b.status,
    b.payment_status,
    b.charge_amount,
    b.platform_fee_amount,
    b.created_at
  FROM public.bookings b
  LEFT JOIN public.business_settings bs ON bs.user_id = b.user_id
  ORDER BY b.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 1000);
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_subscriptions()
RETURNS TABLE(user_id uuid, owner_email text, business_name text, tier text, subscribed boolean, status text, current_period_end timestamp with time zone, trial_end timestamp with time zone, canceled_at timestamp with time zone, stripe_customer_id text, stripe_subscription_id text, created_at timestamp with time zone)
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
    s.user_id,
    u.email::text,
    (SELECT bs.business_name FROM public.business_settings bs WHERE bs.user_id = s.user_id),
    coalesce(s.tier, 'none')::text,
    s.subscribed,
    s.status,
    s.current_period_end,
    s.trial_end,
    s.canceled_at,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.created_at
  FROM public.subscriptions s
  JOIN auth.users u ON u.id = s.user_id
  ORDER BY s.created_at DESC;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_list_bookings(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_bookings(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_bookings(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_subscriptions() TO service_role;
