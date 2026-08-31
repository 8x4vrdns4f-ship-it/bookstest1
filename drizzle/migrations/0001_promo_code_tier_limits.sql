create or replace function public.tier_promo_codes_limit(_tier text)
returns integer language sql immutable set search_path to 'public', 'pg_catalog' as $$
  select case _tier
    when 'silver'   then 0
    when 'gold'     then 1
    when 'platinum' then 2
    else 0
  end;
$$;

create or replace function public.enforce_promo_code_tier_limit()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_tier text;
  v_limit integer;
  v_count integer;
begin
  v_tier := public.get_active_tier(new.user_id);
  if v_tier is null then
    raise exception 'NO_SUBSCRIPTION: This business has no active subscription.';
  end if;
  v_limit := public.tier_promo_codes_limit(v_tier);
  if v_limit = 0 then
    raise exception 'TIER_LIMIT_PROMO_CODES: Promo codes are available on Gold (1 code) and Platinum (2 codes) plans.';
  end if;
  select count(*) into v_count from public.promo_codes where user_id = new.user_id;
  if v_count >= v_limit then
    raise exception 'TIER_LIMIT_PROMO_CODES: % plan allows % promo code(s) (used %)', v_tier, v_limit, v_count;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_promo_code_tier_limit on public.promo_codes;
create trigger trg_enforce_promo_code_tier_limit
before insert on public.promo_codes
for each row execute function public.enforce_promo_code_tier_limit();