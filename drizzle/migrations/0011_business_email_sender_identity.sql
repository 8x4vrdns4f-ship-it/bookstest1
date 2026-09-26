-- Per-business sender identity for customer emails.
-- 'booksuite' (default) sends as "Business Name via BookSuite <noreply@booksuite.online>".
-- 'own' sends as "Business Name <their-word@booksuite.online>" with replies to the business inbox.
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS email_from_mode text NOT NULL DEFAULT 'booksuite',
  ADD COLUMN IF NOT EXISTS email_from_local text;

ALTER TABLE public.business_settings
  DROP CONSTRAINT IF EXISTS business_settings_email_from_mode_check;

ALTER TABLE public.business_settings
  ADD CONSTRAINT business_settings_email_from_mode_check
  CHECK (email_from_mode IN ('booksuite', 'own'));

COMMENT ON COLUMN public.business_settings.email_from_mode IS
  'Sender identity used for customer-facing emails: booksuite | own';
COMMENT ON COLUMN public.business_settings.email_from_local IS
  'Optional local part (before @booksuite.online) used in own mode; derived from business name when null';