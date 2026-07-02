
-- Revoke default EXECUTE from anon/authenticated on all SECURITY DEFINER helpers,
-- then re-grant only to roles that actually need to call them.

-- Trigger/internal functions: revoke from PUBLIC (covers anon+authenticated)
REVOKE ALL ON FUNCTION public.validate_business_settings() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_company_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_booking_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_gift_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_bookings_employee_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_employees_self_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_employees_owner_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_employee_join_requests_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_business_settings_financial_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_booking_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_employee_tier_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tier_staff_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tier_booking_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_owner_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Widget / public-facing RPCs: anon + authenticated may call
REVOKE ALL ON FUNCTION public.get_widget_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_widget_date_overrides(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_widget_date_overrides(uuid, date, date) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_busy_slots(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date, date) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.lookup_business_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_business_by_code(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_business_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business_info(uuid) TO anon, authenticated;

-- Auth-only RPCs: authenticated only
REVOKE ALL ON FUNCTION public.request_to_join_company(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_to_join_company(text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_employee_seat(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_employee_seat(text) TO authenticated;

REVOKE ALL ON FUNCTION public.redeem_gift_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_gift_code(text) TO authenticated;

REVOKE ALL ON FUNCTION public.decide_join_request(uuid, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_join_request(uuid, text, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.check_in_by_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_in_by_code(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.has_company_permission(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_company_permission(uuid, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_active_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_tier(uuid) TO authenticated;
