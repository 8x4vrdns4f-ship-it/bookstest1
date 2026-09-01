-- Admin panel helper functions (security definer, admin-guarded)

CREATE OR REPLACE FUNCTION public.admin_platform_stats()
RETURNS TABLE(
  total_users bigint,
  total_businesses bigint,
  active_subscriptions bigint,
  gold_subscriptions bigint,
  platinum_subscriptions bigint,
  mrr_estimate numeric,
  bookings_total bigint,
  bookings_last_30d bigint,
  open_messages bigint,
  gift_codes_total bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM auth.users),
    (SELECT count(*) FROM public.business_settings),
    (SELECT count(*) FROM public.subscriptions WHERE subscribed),
    (SELECT count(*) FROM public.subscriptions WHERE subscribed AND tier = 'gold'),
    (SELECT count(*) FROM public.subscriptions WHERE subscribed AND tier = 'platinum'),
    (SELECT coalesce(sum(CASE tier WHEN 'silver' THEN 20 WHEN 'gold' THEN 59 WHEN 'platinum' THEN 199 ELSE 0 END), 0) FROM public.subscriptions WHERE subscribed),
    (SELECT count(*) FROM public.bookings),
    (SELECT count(*) FROM public.bookings WHERE created_at > now() - interval '30 days'),
    (SELECT count(*) FROM public.contact_messages WHERE NOT handled),
    (SELECT count(*) FROM public.gift_codes)
$$;

REVOKE ALL ON FUNCTION public.admin_platform_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_platform_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_businesses()
RETURNS TABLE(
  user_id uuid,
  owner_email text,
  business_name text,
  business_category text,
  tier text,
  subscribed boolean,
  status text,
  bookings_count bigint,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bs.user_id,
    u.email,
    bs.business_name,
    bs.business_category,
    coalesce(s.tier, 'none') AS tier,
    coalesce(s.subscribed, false) AS subscribed,
    CASE
      WHEN s.subscribed THEN 'active'
      WHEN s.canceled_at IS NOT NULL THEN 'cancelled'
      ELSE 'none'
    END AS status,
    (SELECT count(*) FROM public.bookings b WHERE b.user_id = bs.user_id),
    bs.created_at
  FROM public.business_settings bs
  JOIN auth.users u ON u.id = bs.user_id
  LEFT JOIN public.subscriptions s ON s.user_id = bs.user_id
  ORDER BY bs.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.admin_list_businesses() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_businesses() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_recent_signups(p_limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  owner_email text,
  display_name text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, p.display_name, u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  ORDER BY u.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100)
$$;

REVOKE ALL ON FUNCTION public.admin_recent_signups(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_recent_signups(integer) TO authenticated;