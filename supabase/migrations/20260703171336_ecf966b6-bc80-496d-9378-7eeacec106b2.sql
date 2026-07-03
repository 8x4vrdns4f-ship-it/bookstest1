ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS client_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_access_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS client_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS review_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_submitted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers can submit via token path"
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can read their own reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage reviews"
  ON public.reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);