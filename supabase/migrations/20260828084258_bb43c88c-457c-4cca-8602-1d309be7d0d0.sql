alter table public.business_settings
  add column if not exists rebooking_reminder_enabled boolean not null default false,
  add column if not exists rebooking_reminder_days integer not null default 60;

create table public.rebooking_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_email text not null,
  last_booking_id uuid references public.bookings(id) on delete set null,
  sent_at timestamptz not null default now()
);
create index rebooking_reminders_user_email_idx on public.rebooking_reminders (user_id, client_email, sent_at desc);
grant select on public.rebooking_reminders to authenticated;
grant all on public.rebooking_reminders to service_role;
alter table public.rebooking_reminders enable row level security;
create policy "Owners can view their rebooking reminder log"
  on public.rebooking_reminders for select to authenticated
  using (auth.uid() = user_id);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'draft',
  audience_count integer not null default 0,
  sent_count integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.campaigns to authenticated;
grant all on public.campaigns to service_role;
alter table public.campaigns enable row level security;
create policy "Owners manage their own campaigns"
  on public.campaigns for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger update_campaigns_updated_at before update on public.campaigns
  for each row execute function public.update_updated_at_column();

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  discount_type text not null default 'percent',
  discount_value numeric not null,
  expires_at timestamptz,
  max_uses integer,
  times_used integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);
grant select, insert, update, delete on public.promo_codes to authenticated;
grant all on public.promo_codes to service_role;
alter table public.promo_codes enable row level security;
create policy "Owners manage their own promo codes"
  on public.promo_codes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger update_promo_codes_updated_at before update on public.promo_codes
  for each row execute function public.update_updated_at_column();

create or replace function public.validate_promo_code_value() returns trigger
language plpgsql set search_path = public as $$
begin
  if NEW.discount_type not in ('percent','fixed') then
    raise exception 'Invalid discount type';
  end if;
  if NEW.discount_value is null or NEW.discount_value <= 0 then
    raise exception 'Discount value must be positive';
  end if;
  if NEW.discount_type = 'percent' and NEW.discount_value > 100 then
    raise exception 'Percent discount cannot exceed 100';
  end if;
  if NEW.discount_type = 'fixed' and NEW.discount_value > 10000 then
    raise exception 'Fixed discount is too large';
  end if;
  NEW.code := upper(trim(NEW.code));
  if length(NEW.code) < 3 or length(NEW.code) > 30 or NEW.code !~ '^[A-Z0-9-]+$' then
    raise exception 'Code must be 3-30 characters: letters, numbers and dashes only';
  end if;
  if NEW.max_uses is not null and NEW.max_uses < 1 then
    raise exception 'Max uses must be at least 1';
  end if;
  return NEW;
end;
$$;
create trigger validate_promo_codes before insert or update on public.promo_codes
  for each row execute function public.validate_promo_code_value();

alter table public.pending_bookings add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null;
alter table public.bookings add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null;

create or replace function public.tier_allows(_tier text, _feature text)
 returns boolean
 language sql
 immutable
 set search_path to 'public', 'pg_catalog'
as $$
  select case _feature
    when 'reviews'          then _tier in ('gold','platinum')
    when 'waitlist'         then _tier in ('gold','platinum')
    when 'sms_reminders'    then _tier in ('gold','platinum')
    when 'custom_branding'  then _tier in ('gold','platinum')
    when 'advanced_analytics' then _tier in ('gold','platinum')
    when 'day_mode'         then _tier in ('gold','platinum')
    when 'resources'        then _tier in ('gold','platinum')
    when 'campaigns'        then _tier in ('gold','platinum')
    when 'promo_codes'      then _tier in ('gold','platinum')
    when 'csv_export'       then _tier = 'platinum'
    when 'gift_codes'       then _tier = 'platinum'
    when 'api_access'       then _tier = 'platinum'
    when 'remove_branding'  then _tier = 'platinum'
    else false
  end;
$$;

create or replace function public.validate_promo_code(p_user_id uuid, p_code text)
returns table(valid boolean, message text, discount_type text, discount_value numeric)
language plpgsql
stable
security definer
set search_path = 'public'
as $$
declare
  v_pc public.promo_codes%rowtype;
begin
  if p_user_id is null or p_code is null or length(trim(p_code)) = 0 then
    return query select false, 'Invalid code'::text, null::text, null::numeric;
    return;
  end if;

  if not public.tier_allows(public.get_active_tier(p_user_id), 'promo_codes') then
    return query select false, 'Invalid code'::text, null::text, null::numeric;
    return;
  end if;

  select * into v_pc from public.promo_codes
   where user_id = p_user_id and code = upper(trim(p_code));

  if not found or not v_pc.active then
    return query select false, 'That code is not valid'::text, null::text, null::numeric;
    return;
  end if;
  if v_pc.expires_at is not null and v_pc.expires_at < now() then
    return query select false, 'That code has expired'::text, null::text, null::numeric;
    return;
  end if;
  if v_pc.max_uses is not null and v_pc.times_used >= v_pc.max_uses then
    return query select false, 'That code has been fully used'::text, null::text, null::numeric;
    return;
  end if;

  return query select true, 'Code applied'::text, v_pc.discount_type, v_pc.discount_value;
end;
$$;
grant execute on function public.validate_promo_code(uuid, text) to anon, authenticated;

create or replace function public.get_lapsed_clients()
returns table(user_id uuid, business_name text, client_name text, client_email text, last_booking_id uuid, last_booking_date date, last_service text, rebooking_reminder_days integer)
language sql
stable
security definer
set search_path = 'public'
as $$
  with latest as (
    select distinct on (b.user_id, lower(b.client_email))
      b.user_id, b.client_name, lower(b.client_email) as client_email,
      b.id as last_booking_id, b.booking_date as last_booking_date, b.service as last_service
    from public.bookings b
    where b.status in ('confirmed','completed')
      and b.client_email is not null and b.client_email <> ''
      and b.booking_date <= current_date
    order by b.user_id, lower(b.client_email), b.booking_date desc, b.created_at desc
  )
  select l.user_id, bs.business_name, l.client_name, l.client_email,
         l.last_booking_id, l.last_booking_date, l.last_service,
         bs.rebooking_reminder_days
  from latest l
  join public.business_settings bs on bs.user_id = l.user_id
  where bs.rebooking_reminder_enabled = true
    and l.last_booking_date <= current_date - bs.rebooking_reminder_days
    and not exists (
      select 1 from public.rebooking_reminders rr
      where rr.user_id = l.user_id and rr.client_email = l.client_email
        and rr.sent_at > now() - interval '90 days'
    )
    and not exists (
      select 1 from public.suppressed_emails se
      where lower(se.email) = l.client_email
    );
$$;
revoke execute on function public.get_lapsed_clients() from anon, authenticated;
grant execute on function public.get_lapsed_clients() to service_role;