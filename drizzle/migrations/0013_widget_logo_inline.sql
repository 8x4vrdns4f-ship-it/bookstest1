DROP POLICY IF EXISTS "Widget logos public read" ON storage.objects;
DROP POLICY IF EXISTS "Owners upload own widget logo" ON storage.objects;
DROP POLICY IF EXISTS "Owners update own widget logo" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete own widget logo" ON storage.objects;

CREATE OR REPLACE FUNCTION public.validate_widget_design()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.accent_color !~ '^#[0-9A-Fa-f]{6}$' THEN RAISE EXCEPTION 'Accent colour must be a hex colour like #3B82F6'; END IF;
  IF NEW.widget_bg_color !~ '^#[0-9A-Fa-f]{6}$' THEN RAISE EXCEPTION 'Background colour must be a hex colour'; END IF;
  IF NEW.widget_text_color !~ '^#[0-9A-Fa-f]{6}$' THEN RAISE EXCEPTION 'Text colour must be a hex colour'; END IF;
  IF NEW.widget_font NOT IN ('Plus Jakarta Sans','Inter','Poppins','Playfair Display','Lora','Montserrat','DM Sans','Space Grotesk') THEN
    RAISE EXCEPTION 'Unsupported font'; END IF;
  IF NEW.widget_radius NOT IN ('sharp','rounded','pill') THEN RAISE EXCEPTION 'Unsupported corner style'; END IF;
  IF NEW.widget_logo_url IS NOT NULL AND (
       length(NEW.widget_logo_url) > 250000
       OR NEW.widget_logo_url !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$') THEN
    RAISE EXCEPTION 'Invalid logo image'; END IF;
  RETURN NEW;
END; $$;