CREATE TABLE public.settings_assistant_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX settings_assistant_usage_user_time ON public.settings_assistant_usage(user_id, created_at);
GRANT SELECT ON public.settings_assistant_usage TO authenticated;
GRANT ALL ON public.settings_assistant_usage TO service_role;
ALTER TABLE public.settings_assistant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own assistant usage" ON public.settings_assistant_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tier_assistant_limit(_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _tier WHEN 'silver' THEN 20 WHEN 'gold' THEN 100 WHEN 'platinum' THEN 500 ELSE 0 END
$$;

-- Returns usage for the caller this calendar month.
CREATE OR REPLACE FUNCTION public.get_assistant_usage()
RETURNS TABLE(used integer, monthly_limit integer, tier text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tier text; v_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  v_admin := public.has_role(auth.uid(), 'admin');
  v_tier := CASE WHEN v_admin THEN 'platinum' ELSE public.get_active_tier(auth.uid()) END;
  RETURN QUERY SELECT
    (SELECT count(*)::int FROM public.settings_assistant_usage u
      WHERE u.user_id = auth.uid() AND u.created_at >= date_trunc('month', now())),
    public.tier_assistant_limit(v_tier),
    v_tier;
END $$;

-- Atomically consume one request. Errors when over the plan limit or too fast.
CREATE OR REPLACE FUNCTION public.consume_assistant_request()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tier text; v_limit int; v_used int; v_last timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('assistant:' || auth.uid()::text));
  v_tier := CASE WHEN public.has_role(auth.uid(), 'admin') THEN 'platinum' ELSE public.get_active_tier(auth.uid()) END;
  v_limit := public.tier_assistant_limit(v_tier);
  IF v_limit = 0 THEN RAISE EXCEPTION 'ASSISTANT_NO_PLAN'; END IF;
  SELECT max(created_at) INTO v_last FROM public.settings_assistant_usage WHERE user_id = auth.uid();
  IF v_last IS NOT NULL AND v_last > now() - interval '4 seconds' THEN
    RAISE EXCEPTION 'ASSISTANT_COOLDOWN';
  END IF;
  SELECT count(*) INTO v_used FROM public.settings_assistant_usage
    WHERE user_id = auth.uid() AND created_at >= date_trunc('month', now());
  IF v_used >= v_limit THEN RAISE EXCEPTION 'ASSISTANT_LIMIT: %', v_limit; END IF;
  INSERT INTO public.settings_assistant_usage(user_id) VALUES (auth.uid());
  RETURN v_limit - v_used - 1;
END $$;

REVOKE ALL ON FUNCTION public.get_assistant_usage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_assistant_request() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_assistant_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_assistant_request() TO authenticated;