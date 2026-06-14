
CREATE OR REPLACE FUNCTION public.redeem_gift_code(p_code text)
 RETURNS TABLE(out_tier text, out_period_end timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_gc public.gift_codes%ROWTYPE;
  v_end timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_gc FROM public.gift_codes
    WHERE upper(gift_codes.code) = upper(p_code)
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE: That code is not valid';
  END IF;

  IF v_gc.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_USED: This code has already been redeemed';
  END IF;

  v_end := now() + interval '30 days';

  UPDATE public.gift_codes
    SET redeemed_by = v_uid, redeemed_at = now()
    WHERE id = v_gc.id;

  INSERT INTO public.subscriptions (user_id, email, subscribed, tier, price_id, current_period_end, updated_at)
  VALUES (v_uid, v_email, true, v_gc.tier, 'gift_' || v_gc.tier, v_end, now())
  ON CONFLICT (user_id) DO UPDATE
    SET subscribed = true,
        tier = EXCLUDED.tier,
        price_id = EXCLUDED.price_id,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = now();

  out_tier := v_gc.tier;
  out_period_end := v_end;
  RETURN NEXT;
END;
$function$;
