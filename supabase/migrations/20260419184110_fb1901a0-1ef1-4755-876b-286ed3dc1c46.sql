-- 1. Company code generator
CREATE OR REPLACE FUNCTION public.generate_company_code()
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
    code := 'BS-';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.business_settings WHERE company_code = code);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique company code';
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- 2. Expand business_settings
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS company_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS business_address text,
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/London',
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS working_hours jsonb NOT NULL DEFAULT '{
    "mon":{"open":"09:00","close":"18:00","closed":false},
    "tue":{"open":"09:00","close":"18:00","closed":false},
    "wed":{"open":"09:00","close":"18:00","closed":false},
    "thu":{"open":"09:00","close":"18:00","closed":false},
    "fri":{"open":"09:00","close":"18:00","closed":false},
    "sat":{"open":"10:00","close":"16:00","closed":false},
    "sun":{"open":"10:00","close":"16:00","closed":true}
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_confirm boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_same_day boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_advance_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS cancellation_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS notify_new_booking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_daily_summary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_client_confirmation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_client_reminder boolean NOT NULL DEFAULT true;

-- Backfill company_code for existing rows
UPDATE public.business_settings
SET company_code = public.generate_company_code()
WHERE company_code IS NULL;

-- Set default for new rows
ALTER TABLE public.business_settings
  ALTER COLUMN company_code SET DEFAULT public.generate_company_code();

-- 3. Trigger: auto-create business_settings on new owner signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  -- Skip auto-creating business_settings for employee signups
  IF (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'employee' THEN
    INSERT INTO public.business_settings (user_id, business_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'display_name', 'My Business'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Employees: link to a real auth user
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- Allow employee (signed-in auth user) to view their own employee row
DROP POLICY IF EXISTS "Employees can view own row" ON public.employees;
CREATE POLICY "Employees can view own row"
ON public.employees
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Employees can update own row" ON public.employees;
CREATE POLICY "Employees can update own row"
ON public.employees
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- 5. Allow signed-in users to look up a business by company_code (for join flow)
DROP POLICY IF EXISTS "Authenticated can lookup business by code" ON public.business_settings;
CREATE POLICY "Authenticated can lookup business by code"
ON public.business_settings
FOR SELECT
TO authenticated
USING (true);

-- 6. Allow employees to view bookings for their company
DROP POLICY IF EXISTS "Employees can view company bookings" ON public.bookings;
CREATE POLICY "Employees can view company bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.user_id = bookings.user_id
  )
);