CREATE TABLE public.client_portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  session_token_hash text,
  session_expires_at timestamptz,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_portal_sessions_token_hash ON public.client_portal_sessions (token_hash);
CREATE INDEX idx_client_portal_sessions_session_hash ON public.client_portal_sessions (session_token_hash);
CREATE INDEX idx_client_portal_sessions_email ON public.client_portal_sessions (email);

GRANT ALL ON public.client_portal_sessions TO service_role;

ALTER TABLE public.client_portal_sessions ENABLE ROW LEVEL SECURITY;

-- No policies: only the service role (edge functions) may read or write this table.