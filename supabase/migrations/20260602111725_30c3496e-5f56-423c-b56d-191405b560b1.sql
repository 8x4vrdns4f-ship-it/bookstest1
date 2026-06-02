ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS retention_offer_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_end timestamptz;