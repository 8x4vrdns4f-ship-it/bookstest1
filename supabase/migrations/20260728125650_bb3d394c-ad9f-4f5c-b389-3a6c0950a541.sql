
-- 1. Add waitlist_enabled to business_settings
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS waitlist_enabled boolean NOT NULL DEFAULT true;

-- 2. Create waitlist_entries table
CREATE TABLE public.waitlist_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  service text,
  preferred_date date NOT NULL,
  preferred_time_start time,
  preferred_time_end time,
  party_size integer,
  notes text,
  status text NOT NULL DEFAULT 'active',
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_user_date ON public.waitlist_entries(user_id, preferred_date, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_entries TO authenticated;
GRANT ALL ON public.waitlist_entries TO service_role;

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Owners manage their waitlist
CREATE POLICY "Owners select their waitlist"
  ON public.waitlist_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert their waitlist"
  ON public.waitlist_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update their waitlist"
  ON public.waitlist_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete their waitlist"
  ON public.waitlist_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER waitlist_entries_updated_at
  BEFORE UPDATE ON public.waitlist_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Public RPC for widget to insert entries
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_user_id uuid,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_service text,
  p_preferred_date date,
  p_preferred_time_start time,
  p_preferred_time_end time,
  p_party_size integer,
  p_notes text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
  v_id uuid;
BEGIN
  IF p_client_name IS NULL OR length(trim(p_client_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF p_client_email IS NULL OR length(trim(p_client_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF p_preferred_date IS NULL OR p_preferred_date < current_date THEN
    RAISE EXCEPTION 'A future date is required';
  END IF;

  SELECT waitlist_enabled INTO v_enabled FROM public.business_settings WHERE user_id = p_user_id;
  IF v_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Waitlist not enabled for this business';
  END IF;

  INSERT INTO public.waitlist_entries (
    user_id, client_name, client_email, client_phone, service,
    preferred_date, preferred_time_start, preferred_time_end,
    party_size, notes
  ) VALUES (
    p_user_id, trim(p_client_name), lower(trim(p_client_email)), p_client_phone, p_service,
    p_preferred_date, p_preferred_time_start, p_preferred_time_end,
    p_party_size, p_notes
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_waitlist(uuid, text, text, text, text, date, time, time, integer, text) TO anon, authenticated;

-- 4. Extend get_widget_settings to include waitlist_enabled
DROP FUNCTION IF EXISTS public.get_widget_settings(uuid);
CREATE OR REPLACE FUNCTION public.get_widget_settings(p_user_id uuid)
 RETURNS TABLE(user_id uuid, business_name text, welcome_message text, accent_color text, deposit_amount numeric, currency text, timezone text, working_hours jsonb, allow_same_day boolean, max_advance_days integer, buffer_minutes integer, resources_enabled boolean, resource_label text, party_size_enabled boolean, assignment_mode text, waitlist_enabled boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT user_id, business_name, welcome_message, accent_color,
         deposit_amount, currency, timezone, working_hours,
         allow_same_day, max_advance_days, buffer_minutes,
         resources_enabled, resource_label, party_size_enabled, assignment_mode,
         waitlist_enabled
  FROM public.business_settings
  WHERE user_id = p_user_id;
$function$;
