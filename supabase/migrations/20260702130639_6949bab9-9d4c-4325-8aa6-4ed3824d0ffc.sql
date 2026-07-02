
-- Revoke EXECUTE from anon/authenticated on internal / trigger-only SECURITY DEFINER helpers.
-- Triggers still run (they use the table owner), and edge functions use service_role.

DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'validate_business_settings()',
    'generate_company_code()',
    'generate_gift_code()',
    'generate_booking_code()',
    'get_owner_email(uuid)',
    'enforce_employee_tier_limit()',
    'enforce_booking_tier_limit()',
    'tier_booking_limit(text)',
    'tier_staff_limit(text)',
    'guard_bookings_employee_update()',
    'guard_employees_self_update()',
    'guard_employees_owner_update()',
    'guard_business_settings_financial_update()',
    'guard_employee_join_requests_update()',
    'handle_new_user()',
    'email_queue_wake()',
    'email_queue_dispatch()',
    'update_updated_at_column()',
    'move_to_dlq(text, text, bigint, jsonb)',
    'delete_email(text, bigint)',
    'enqueue_email(text, jsonb)',
    'read_email_batch(text, integer, integer)',
    'has_role(uuid, app_role)',
    'has_company_permission(uuid, uuid, text)',
    'get_active_tier(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- Public widget/booking-page RPCs remain callable by anon + authenticated
GRANT EXECUTE ON FUNCTION public.get_widget_settings(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_widget_date_overrides(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_business_info(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_business_by_code(text) TO anon, authenticated;

-- Authenticated-only RPCs (each function re-checks auth.uid())
REVOKE EXECUTE ON FUNCTION public.request_to_join_company(text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.request_to_join_company(text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.redeem_gift_code(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.redeem_gift_code(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_employee_seat(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.claim_employee_seat(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.decide_join_request(uuid, text, uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.decide_join_request(uuid, text, uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.check_in_by_code(text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.check_in_by_code(text, text) TO authenticated;
