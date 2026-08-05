CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://rehafgjaqbdeuatnfiyk.supabase.co/functions/v1/notify-admin-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := jsonb_build_object('user_id', NEW.user_id, 'display_name', NEW.display_name)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_admin_new_signup failed: %', SQLERRM;
  END;
  RETURN NULL;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_admin_new_signup() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_admin_new_signup ON public.profiles;
CREATE TRIGGER trg_notify_admin_new_signup
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_signup();