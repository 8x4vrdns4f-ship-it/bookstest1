CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket text NOT NULL,
  identifier text NOT NULL,
  hit_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX rate_limits_bucket_identifier_idx ON public.rate_limits (bucket, identifier);
CREATE INDEX rate_limits_window_start_idx ON public.rate_limits (window_start);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket text,
  p_identifier text,
  p_max_hits integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.rate_limits%ROWTYPE;
BEGIN
  IF p_identifier IS NULL OR length(trim(p_identifier)) = 0 THEN
    RETURN true;
  END IF;

  SELECT * INTO v_row FROM public.rate_limits
    WHERE bucket = p_bucket AND identifier = p_identifier
    FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (bucket, identifier, hit_count, window_start)
    VALUES (p_bucket, p_identifier, 1, now())
    ON CONFLICT (bucket, identifier) DO UPDATE
      SET hit_count = public.rate_limits.hit_count + 1, updated_at = now();
    RETURN true;
  END IF;

  IF v_row.window_start < now() - make_interval(secs => p_window_seconds) THEN
    UPDATE public.rate_limits
      SET hit_count = 1, window_start = now(), updated_at = now()
      WHERE id = v_row.id;
    RETURN true;
  END IF;

  IF v_row.hit_count >= p_max_hits THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits
    SET hit_count = v_row.hit_count + 1, updated_at = now()
    WHERE id = v_row.id;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;