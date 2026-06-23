CREATE TABLE public.embed_assistant_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX embed_assistant_usage_user_created_idx
  ON public.embed_assistant_usage (user_id, created_at DESC);

GRANT SELECT ON public.embed_assistant_usage TO authenticated;
GRANT ALL ON public.embed_assistant_usage TO service_role;

ALTER TABLE public.embed_assistant_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own embed assistant usage"
  ON public.embed_assistant_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
