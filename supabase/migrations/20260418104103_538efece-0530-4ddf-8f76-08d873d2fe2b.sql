-- 1) business_settings table
CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  deposit_amount numeric(10,2) NOT NULL DEFAULT 10.00,
  platform_fee_percent numeric(5,2) NOT NULL DEFAULT 5.00,
  day_start_hour integer NOT NULL DEFAULT 9,
  day_end_hour integer NOT NULL DEFAULT 18,
  business_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enforce min deposit £10 and sensible hours via trigger (CHECK must be immutable; this is fine but trigger gives nicer errors)
CREATE OR REPLACE FUNCTION public.validate_business_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deposit_amount < 10 THEN
    RAISE EXCEPTION 'Deposit amount must be at least £10';
  END IF;
  IF NEW.day_start_hour < 0 OR NEW.day_start_hour > 23 THEN
    RAISE EXCEPTION 'day_start_hour must be 0-23';
  END IF;
  IF NEW.day_end_hour < 1 OR NEW.day_end_hour > 24 THEN
    RAISE EXCEPTION 'day_end_hour must be 1-24';
  END IF;
  IF NEW.day_end_hour <= NEW.day_start_hour THEN
    RAISE EXCEPTION 'day_end_hour must be greater than day_start_hour';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_business_settings
BEFORE INSERT OR UPDATE ON public.business_settings
FOR EACH ROW EXECUTE FUNCTION public.validate_business_settings();

CREATE TRIGGER trg_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own settings"
ON public.business_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own settings"
ON public.business_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own settings"
ON public.business_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Public/anon read so the embeddable widget can fetch hours + deposit
CREATE POLICY "Public can read business settings for widget"
ON public.business_settings FOR SELECT
TO anon
USING (true);

-- 2) bookings additions
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmation_code text,
  ADD COLUMN IF NOT EXISTS decline_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_confirmation_code_unique
  ON public.bookings (confirmation_code)
  WHERE confirmation_code IS NOT NULL;

-- Allow anon to read minimal booking info (date/time/duration) so widget can hide booked slots.
-- We expose only what's needed via a security-definer function instead of a broad policy.
CREATE OR REPLACE FUNCTION public.get_busy_slots(p_user_id uuid, p_from date, p_to date)
RETURNS TABLE(booking_date date, booking_time time, duration_minutes integer, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT booking_date, booking_time, duration_minutes, status
  FROM public.bookings
  WHERE user_id = p_user_id
    AND booking_date BETWEEN p_from AND p_to
    AND status IN ('pending','confirmed');
$$;

GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date, date) TO anon, authenticated;

-- 3) Generate unique 6-char alphanumeric confirmation code (no ambiguous chars)
CREATE OR REPLACE FUNCTION public.generate_booking_code()
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
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE confirmation_code = code);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique booking code';
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_booking_code() TO authenticated;