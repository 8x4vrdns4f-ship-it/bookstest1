ALTER TABLE public.pending_bookings ADD COLUMN IF NOT EXISTS expired_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_pending_bookings_awaiting_created
  ON public.pending_bookings (created_at)
  WHERE status = 'awaiting_owner';