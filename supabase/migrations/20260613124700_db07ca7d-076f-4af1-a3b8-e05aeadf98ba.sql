
-- gift_codes table
CREATE TABLE public.gift_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  tier text NOT NULL CHECK (tier IN ('silver','gold','platinum')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gift_codes_created_by_idx ON public.gift_codes(created_by);
CREATE INDEX gift_codes_code_idx ON public.gift_codes(code);

GRANT SELECT, INSERT ON public.gift_codes TO authenticated;
GRANT ALL ON public.gift_codes TO service_role;

ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- Creators can view their own codes
CREATE POLICY "Creators view own codes"
ON public.gift_codes FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Authenticated users can insert codes (created_by must be themselves)
CREATE POLICY "Authenticated create codes"
ON public.gift_codes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Generator: returns GIFT-XXXXXX format
CREATE OR REPLACE FUNCTION public.generate_gift_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i integer;
  attempts integer := 0;
BEGIN
  LOOP
    code := 'GIFT-';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.gift_codes WHERE gift_codes.code = code);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique gift code';
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- Redeem function
CREATE OR REPLACE FUNCTION public.redeem_gift_code(p_code text)
RETURNS TABLE(tier text, current_period_end timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    WHERE upper(code) = upper(p_code)
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE: That code is not valid';
  END IF;

  IF v_gc.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_USED: This code has already been redeemed';
  END IF;

  -- Prevent same user redeeming more than one active gift simultaneously
  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = v_uid AND subscribed = true
      AND price_id LIKE 'gift_%'
      AND (current_period_end IS NULL OR current_period_end > now())
  ) THEN
    RAISE EXCEPTION 'ACTIVE_GIFT: You already have an active gift subscription';
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

  RETURN QUERY SELECT v_gc.tier, v_end;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_gift_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_gift_code(text) TO authenticated;
