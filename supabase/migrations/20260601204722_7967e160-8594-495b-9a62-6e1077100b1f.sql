-- Internal/trigger-only functions: revoke from everyone except postgres
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_business_settings() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_company_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_booking_code() FROM PUBLIC, anon, authenticated;

-- Email queue helpers: service_role only
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- Authenticated-only actions: revoke anon
REVOKE EXECUTE ON FUNCTION public.claim_employee_seat(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.request_to_join_company(text, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decide_join_request(uuid, text, uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_company_permission(uuid, uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_employee_seat(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_to_join_company(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_join_request(uuid, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_permission(uuid, uuid, text) TO authenticated;

-- Internal owner-only query helper: revoke anon (callable by signed-in owner)
REVOKE EXECUTE ON FUNCTION public.get_busy_slots(uuid, date, date) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date, date) TO authenticated;

-- Public widget/kiosk functions: keep callable by anon (these are intentionally public)
-- get_widget_settings, get_widget_date_overrides, lookup_business_by_code, check_in_by_code
-- These remain accessible — no changes needed.