DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'connect_accounts_user_id_key'
      AND conrelid = 'public.connect_accounts'::regclass
  ) THEN
    ALTER TABLE public.connect_accounts DROP CONSTRAINT connect_accounts_user_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS connect_accounts_user_environment_unique
  ON public.connect_accounts (user_id, environment);

ALTER TABLE public.connect_accounts
  DROP CONSTRAINT IF EXISTS connect_accounts_environment_check;

ALTER TABLE public.connect_accounts
  ADD CONSTRAINT connect_accounts_environment_check
  CHECK (environment IN ('sandbox', 'live'));

CREATE INDEX IF NOT EXISTS idx_connect_accounts_user_environment
  ON public.connect_accounts (user_id, environment);