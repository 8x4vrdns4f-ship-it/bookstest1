-- Run against the application database with a privileged test connection.
-- Every fixture is transaction-local; no Stripe calls or persistent data changes.
BEGIN;
DO $$
DECLARE
  owner_id uuid;
  paid_id uuid := gen_random_uuid();
  manual_id uuid := gen_random_uuid();
  insert_id uuid := gen_random_uuid();
  result_amount numeric;
  result_status text;
  field_name text;
BEGIN
  SELECT user_id INTO owner_id FROM public.business_settings LIMIT 1;
  IF owner_id IS NULL THEN RAISE EXCEPTION 'No owner available'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  INSERT INTO public.subscriptions(user_id,email,subscribed,tier,current_period_end)
  VALUES(owner_id,'guard-qa@example.invalid',true,'platinum',now()+interval '1 hour');
  INSERT INTO public.bookings(id,user_id,client_name,service,booking_date,booking_time,status,payment_status,charge_amount,stripe_payment_intent_id,payment_environment)
  VALUES(paid_id,owner_id,'Throwaway guard paid','QA only','2026-11-08','12:00','confirmed','paid',10,'pi_throwaway_no_stripe_call','sandbox'),
        (manual_id,owner_id,'Throwaway guard manual','QA only','2026-11-08','14:00','confirmed','unpaid',NULL,NULL,'sandbox');
  PERFORM set_config('request.jwt.claims', json_build_object('role','authenticated','sub',owner_id)::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  FOREACH field_name IN ARRAY ARRAY['charge_amount','deposit_amount','platform_fee_amount','service_price','stripe_payment_intent_id','stripe_charge_id','stripe_checkout_session_id'] LOOP
    BEGIN
      IF field_name LIKE 'stripe_%' THEN
        EXECUTE format('UPDATE public.bookings SET %I = %L WHERE id = $1',field_name,'forged_qa_value') USING paid_id;
      ELSE
        EXECUTE format('UPDATE public.bookings SET %I = 99 WHERE id = $1',field_name) USING paid_id;
      END IF;
      RAISE EXCEPTION 'TEST FAILED: paid money edit allowed (%)',field_name;
    EXCEPTION WHEN SQLSTATE 'P0001' THEN
      IF SQLERRM <> 'Payment details on a booking can only be changed by the payment system' THEN RAISE; END IF;
    END;
  END LOOP;
  UPDATE public.bookings SET charge_amount=12 WHERE id=manual_id RETURNING charge_amount INTO result_amount;
  IF result_amount IS DISTINCT FROM 12 THEN RAISE EXCEPTION 'TEST FAILED: manual edit'; END IF;
  INSERT INTO public.bookings(id,user_id,client_name,service,booking_date,booking_time,payment_environment,payment_status,stripe_payment_intent_id,stripe_charge_id,stripe_checkout_session_id,refund_id,refund_amount,charge_amount,platform_fee_amount)
  VALUES(insert_id,owner_id,'Throwaway guard insert','QA only','2026-11-08','16:00','sandbox','paid','pi_fake','ch_fake','cs_fake','re_fake',7,10,0.3)
  RETURNING payment_status INTO result_status;
  IF result_status IS DISTINCT FROM 'unpaid' THEN RAISE EXCEPTION 'TEST FAILED: forged paid status retained'; END IF;
  IF EXISTS(SELECT 1 FROM public.bookings WHERE id=insert_id AND (stripe_payment_intent_id IS NOT NULL OR stripe_charge_id IS NOT NULL OR stripe_checkout_session_id IS NOT NULL OR refund_id IS NOT NULL OR refund_amount IS NOT NULL OR charge_amount IS NOT NULL OR platform_fee_amount IS NOT NULL)) THEN
    RAISE EXCEPTION 'TEST FAILED: forged details retained';
  END IF;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  EXECUTE 'SET LOCAL ROLE service_role';
  UPDATE public.bookings SET charge_amount=15 WHERE id=paid_id RETURNING charge_amount INTO result_amount;
  IF result_amount IS DISTINCT FROM 15 THEN RAISE EXCEPTION 'TEST FAILED: service role affected'; END IF;
  EXECUTE 'RESET ROLE';
END $$;
ROLLBACK;