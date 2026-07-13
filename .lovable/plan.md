## Fix "permission denied" on gift code generation

Root cause: `public.generate_gift_code()` has no `EXECUTE` grant for the `authenticated` role, so the RPC call from the dashboard is rejected before any row is inserted. It's also running as `SECURITY INVOKER` and reads all of `gift_codes` to check uniqueness — which the new per-user SELECT policy would hide.

### Migration
- `ALTER FUNCTION public.generate_gift_code() SECURITY DEFINER SET search_path = public;` so the uniqueness check sees every row regardless of the caller's RLS.
- `REVOKE EXECUTE ON FUNCTION public.generate_gift_code() FROM PUBLIC, anon;`
- `GRANT EXECUTE ON FUNCTION public.generate_gift_code() TO authenticated;`

No frontend or policy changes needed — the INSERT policy and monthly-cap trigger from the previous migration already gate who can actually store a code.

### Verification
- Sign in as a subscriber → Generate code → toast shows `GIFT-XXXXXX` and the row appears.
- Sign in as a non-subscriber → RPC succeeds but the INSERT is blocked by RLS → "Subscription required" toast fires (existing tier-error handler).
