
CREATE OR REPLACE FUNCTION public.generate_gift_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  i integer;
  attempts integer := 0;
BEGIN
  LOOP
    v_code := 'GIFT-';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.gift_codes WHERE code = v_code);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique gift code';
    END IF;
  END LOOP;
  RETURN v_code;
END;
$$;
