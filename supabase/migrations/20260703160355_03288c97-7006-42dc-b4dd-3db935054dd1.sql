ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS pending_request_ttl_hours integer NOT NULL DEFAULT 48;

CREATE OR REPLACE FUNCTION public.validate_business_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
  IF NEW.pending_request_ttl_hours < 1 OR NEW.pending_request_ttl_hours > 168 THEN
    RAISE EXCEPTION 'pending_request_ttl_hours must be between 1 and 168';
  END IF;
  RETURN NEW;
END;
$function$;