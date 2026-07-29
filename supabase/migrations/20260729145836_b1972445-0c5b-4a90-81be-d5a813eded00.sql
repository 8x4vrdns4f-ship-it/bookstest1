
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS owner_reply text,
  ADD COLUMN IF NOT EXISTS owner_reply_at timestamptz;

-- Owners can update their own reviews (guarded by trigger below)
DROP POLICY IF EXISTS "Owners can reply to their reviews" ON public.reviews;
CREATE POLICY "Owners can reply to their reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Guard: only owner_reply / owner_reply_at may change
CREATE OR REPLACE FUNCTION public.guard_reviews_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.comment IS DISTINCT FROM OLD.comment
     OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only owner_reply can be modified on a review';
  END IF;
  IF NEW.owner_reply IS NOT NULL AND length(NEW.owner_reply) > 1000 THEN
    RAISE EXCEPTION 'Reply must be 1000 characters or fewer';
  END IF;
  IF NEW.owner_reply IS DISTINCT FROM OLD.owner_reply THEN
    NEW.owner_reply_at := CASE WHEN NEW.owner_reply IS NULL THEN NULL ELSE now() END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_reviews_owner_update ON public.reviews;
CREATE TRIGGER trg_guard_reviews_owner_update
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.guard_reviews_owner_update();

-- Public RPC for reading reviews with replies (safe columns only)
CREATE OR REPLACE FUNCTION public.get_public_reviews(_user_id uuid, _limit int DEFAULT 20)
RETURNS TABLE (
  rating int,
  comment text,
  owner_reply text,
  owner_reply_at timestamptz,
  created_at timestamptz,
  client_first_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.rating, r.comment, r.owner_reply, r.owner_reply_at, r.created_at,
         split_part(coalesce(b.client_name, 'Client'), ' ', 1) AS client_first_name
  FROM public.reviews r
  LEFT JOIN public.bookings b ON b.id = r.booking_id
  WHERE r.user_id = _user_id
  ORDER BY r.created_at DESC
  LIMIT GREATEST(1, LEAST(coalesce(_limit, 20), 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid, int) TO anon, authenticated;
