-- Replace admin-only insert policy on gift_codes with subscriber policy
DROP POLICY IF EXISTS "Admins can create gift codes" ON public.gift_codes;

CREATE POLICY "Subscribers can create gift codes"
ON public.gift_codes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND public.get_active_tier(auth.uid()) IS NOT NULL
);

-- Allow creators to see their own codes (in addition to admin SELECT policy)
CREATE POLICY "Creators can view their own gift codes"
ON public.gift_codes
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Monthly cap trigger: max 5 gift codes per user per calendar month
CREATE OR REPLACE FUNCTION public.enforce_gift_code_monthly_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_month_start timestamptz := date_trunc('month', now());
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM public.gift_codes
    WHERE created_by = NEW.created_by
      AND created_at >= v_month_start;
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'TIER_LIMIT_GIFT_CODES: You can create up to 5 gift codes per month (used %)', v_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_gift_code_monthly_limit_trg ON public.gift_codes;
CREATE TRIGGER enforce_gift_code_monthly_limit_trg
BEFORE INSERT ON public.gift_codes
FOR EACH ROW EXECUTE FUNCTION public.enforce_gift_code_monthly_limit();