
-- 1) Re-ensure guard trigger exists for bookings employee updates
DROP TRIGGER IF EXISTS trg_guard_bookings_employee_update ON public.bookings;
CREATE TRIGGER trg_guard_bookings_employee_update
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_bookings_employee_update();

-- 2) Add guard for business_settings financial column changes (only owner may change)
CREATE OR REPLACE FUNCTION public.guard_business_settings_financial_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM NEW.user_id THEN
    IF NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
       OR NEW.platform_fee_percent IS DISTINCT FROM OLD.platform_fee_percent
       OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Only the business owner can modify financial settings';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_business_settings_financial_update ON public.business_settings;
CREATE TRIGGER trg_guard_business_settings_financial_update
BEFORE UPDATE ON public.business_settings
FOR EACH ROW EXECUTE FUNCTION public.guard_business_settings_financial_update();

-- 3) Revoke EXECUTE on sensitive SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_owner_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_busy_slots(uuid, date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_employee_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_bookings_employee_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_employees_self_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_employees_owner_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_employee_join_requests_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_business_settings_financial_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_business_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_booking_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_company_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_gift_code() FROM PUBLIC, anon, authenticated;
