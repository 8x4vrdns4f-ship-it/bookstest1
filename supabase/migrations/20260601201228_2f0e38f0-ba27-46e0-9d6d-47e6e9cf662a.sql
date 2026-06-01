ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS self_checkin_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reception_checkin_enabled boolean NOT NULL DEFAULT true;

-- Public RPC: check in by code (used by kiosk and receptionist)
CREATE OR REPLACE FUNCTION public.check_in_by_code(p_company_code text, p_confirmation_code text)
RETURNS TABLE(booking_id uuid, client_name text, service text, booking_time time, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_user_id uuid;
  v_booking public.bookings%ROWTYPE;
BEGIN
  SELECT user_id INTO v_business_user_id FROM public.business_settings
   WHERE company_code = upper(p_company_code) LIMIT 1;
  IF v_business_user_id IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  SELECT * INTO v_booking FROM public.bookings
   WHERE user_id = v_business_user_id
     AND upper(confirmation_code) = upper(p_confirmation_code)
     AND booking_date >= (now() AT TIME ZONE 'UTC')::date - INTERVAL '1 day'
   ORDER BY booking_date ASC, booking_time ASC
   LIMIT 1;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found for that code';
  END IF;

  IF v_booking.status NOT IN ('pending','confirmed','waiting') THEN
    RAISE EXCEPTION 'Booking is already %', v_booking.status;
  END IF;

  UPDATE public.bookings SET status = 'in_progress', updated_at = now() WHERE id = v_booking.id;

  RETURN QUERY SELECT v_booking.id, v_booking.client_name, v_booking.service, v_booking.booking_time, 'in_progress'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_in_by_code(text, text) TO anon, authenticated;