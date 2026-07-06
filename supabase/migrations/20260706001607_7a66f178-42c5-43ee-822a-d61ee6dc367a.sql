-- 1. Drop the permissive reviews INSERT policy (submit-review edge function uses service role, which bypasses RLS).
DROP POLICY IF EXISTS "Reviewers can submit via token path" ON public.reviews;

-- 2. Revoke EXECUTE from anon/authenticated on internal-only SECURITY DEFINER functions
--    (triggers, generators, email queue helpers, tier helpers, owner-email lookup).
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.update_updated_at_column()',
    'public.validate_business_settings()',
    'public.enforce_employee_tier_limit()',
    'public.enforce_booking_tier_limit()',
    'public.guard_bookings_employee_update()',
    'public.guard_employees_self_update()',
    'public.guard_employees_owner_update()',
    'public.guard_business_settings_financial_update()',
    'public.guard_employee_join_requests_update()',
    'public.email_queue_wake()',
    'public.email_queue_dispatch()',
    'public.enqueue_email(text, jsonb)',
    'public.delete_email(text, bigint)',
    'public.read_email_batch(text, integer, integer)',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.generate_booking_code()',
    'public.generate_company_code()',
    'public.generate_gift_code()',
    'public.tier_booking_limit(text)',
    'public.tier_staff_limit(text)',
    'public.get_owner_email(uuid)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END$$;

-- 3. Reschedule the four cron jobs to include the service-role key in the Authorization header
--    (matches the guard in each edge function).
DO $$
DECLARE
  v_service_key text;
BEGIN
  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF v_service_key IS NULL THEN
    RAISE EXCEPTION 'Missing vault secret email_queue_service_role_key — cannot reschedule cron jobs';
  END IF;

  -- expire-pending-bookings (every 15 min)
  PERFORM cron.unschedule('expire-pending-bookings');
  PERFORM cron.schedule('expire-pending-bookings', '*/15 * * * *', format($cmd$
    SELECT net.http_post(
      url := 'https://rehafgjaqbdeuatnfiyk.supabase.co/functions/v1/expire-pending-bookings',
      headers := %L::jsonb,
      body := '{}'::jsonb
    );
  $cmd$, jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_key
  )::text));

  -- remind-pending-bookings (hourly)
  PERFORM cron.unschedule('remind-pending-bookings');
  PERFORM cron.schedule('remind-pending-bookings', '0 * * * *', format($cmd$
    SELECT net.http_post(
      url := 'https://rehafgjaqbdeuatnfiyk.supabase.co/functions/v1/remind-pending-bookings',
      headers := %L::jsonb,
      body := '{}'::jsonb
    );
  $cmd$, jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_key
  )::text));

  -- send-booking-reminders-hourly
  PERFORM cron.unschedule('send-booking-reminders-hourly');
  PERFORM cron.schedule('send-booking-reminders-hourly', '0 * * * *', format($cmd$
    SELECT net.http_post(
      url := 'https://rehafgjaqbdeuatnfiyk.supabase.co/functions/v1/send-booking-reminders',
      headers := %L::jsonb,
      body := '{}'::jsonb
    );
  $cmd$, jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_key
  )::text));

  -- send-review-requests-daily (9am)
  PERFORM cron.unschedule('send-review-requests-daily');
  PERFORM cron.schedule('send-review-requests-daily', '0 9 * * *', format($cmd$
    SELECT net.http_post(
      url := 'https://rehafgjaqbdeuatnfiyk.supabase.co/functions/v1/send-review-requests',
      headers := %L::jsonb,
      body := '{}'::jsonb
    );
  $cmd$, jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_key
  )::text));
END$$;