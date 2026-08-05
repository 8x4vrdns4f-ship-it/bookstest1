CREATE OR REPLACE FUNCTION public.join_waitlist(p_user_id uuid, p_client_name text, p_client_email text, p_client_phone text, p_service text, p_preferred_date date, p_preferred_time_start time without time zone, p_preferred_time_end time without time zone, p_party_size integer, p_notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF NOT public.check_rate_limit('waitlist', 'email:' || lower(trim(p_client_email)), 8, 3600) THEN
    RAISE EXCEPTION 'RATE_LIMITED: Too many waitlist requests. Please try again later.';
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
$function$;