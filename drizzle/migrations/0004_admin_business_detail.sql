create or replace function public.admin_business_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'owner_email', public.get_owner_email(p_user_id),
    'profile', (select to_jsonb(p) from public.profiles p where p.user_id = p_user_id limit 1),
    'settings', (select to_jsonb(b) from public.business_settings b where b.user_id = p_user_id limit 1),
    'subscription', (select to_jsonb(s) from public.subscriptions s where s.user_id = p_user_id limit 1),
    'connect_account', (select to_jsonb(c) from public.connect_accounts c where c.user_id = p_user_id limit 1),
    'counts', jsonb_build_object(
      'bookings', (select count(*) from public.bookings where user_id = p_user_id),
      'bookings_30d', (select count(*) from public.bookings where user_id = p_user_id and created_at > now() - interval '30 days'),
      'clients', (select count(*) from public.clients where user_id = p_user_id),
      'employees', (select count(*) from public.employees where user_id = p_user_id),
      'services', (select count(*) from public.services where user_id = p_user_id),
      'resources', (select count(*) from public.resources where user_id = p_user_id),
      'promo_codes', (select count(*) from public.promo_codes where user_id = p_user_id),
      'reviews', (select count(*) from public.reviews where user_id = p_user_id),
      'waitlist', (select count(*) from public.waitlist_entries where user_id = p_user_id)
    ),
    'revenue', jsonb_build_object(
      'charged_total', (select coalesce(sum(charge_amount),0) from public.bookings where user_id = p_user_id and payment_status = 'paid'),
      'platform_fees', (select coalesce(sum(platform_fee_amount),0) from public.bookings where user_id = p_user_id and payment_status = 'paid')
    ),
    'avg_rating', (select round(avg(rating)::numeric, 2) from public.reviews where user_id = p_user_id),
    'employees', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'email', e.email, 'position', e.position, 'linked', e.auth_user_id is not null) order by e.created_at)
      from public.employees e where e.user_id = p_user_id
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'duration_minutes', s.duration_minutes, 'price', s.price, 'active', s.active) order by s.sort_order)
      from public.services s where s.user_id = p_user_id
    ), '[]'::jsonb),
    'recent_bookings', coalesce((
      select jsonb_agg(x) from (
        select b.id, b.client_name, b.service, b.booking_date, b.booking_time, b.status, b.payment_status, b.charge_amount
        from public.bookings b where b.user_id = p_user_id
        order by b.created_at desc limit 10
      ) x
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_business_detail(uuid) from public, anon;
grant execute on function public.admin_business_detail(uuid) to authenticated;