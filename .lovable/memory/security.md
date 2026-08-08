---
name: Security Memory
description: Guidance for security scanners on intentional design decisions
type: constraint
---

# BookSuite Security Memory

## App context
BookSuite is a multi-tenant booking SaaS. Each business owner (`auth.users.id == business_settings.user_id`) has bookings, employees, roles, and settings. There is also an embeddable booking widget served to third-party websites that must work for anonymous visitors.

## Never
- Never expose full-table RLS on tenant tables to `anon`.
- Never grant EXECUTE on internal trigger/queue helper functions to `anon` or `authenticated`.
- Never store roles on `profiles` or `business_settings` — always use `user_roles` + `has_role`.
- Never bypass the has_company_permission / has_role checks inside SECURITY DEFINER RPCs.

## Intentional SECURITY DEFINER functions — do not flag
All `public.*` SECURITY DEFINER functions in this project are intentional and either have their own auth check inside the function body or return only non-sensitive tenant data keyed by an explicit user_id argument. Do not raise findings for `SUPA_anon_security_definer_function_executable` or `SUPA_authenticated_security_definer_function_executable` for the following (or functions of the same shape added later):

- Public widget/booking read helpers callable by `anon` (return only public business info, tenant-scoped by an explicit p_user_id argument, for the embed widget):
  `get_widget_settings`, `get_widget_services`, `get_widget_resources`, `get_widget_date_overrides`, `get_busy_slots`, `get_public_business_info`, `get_public_reviews`, `lookup_business_by_code`, `join_waitlist` (rate-limited + validates waitlist_enabled).
- Auth-only RPCs granted to `authenticated` only (never `anon`) that perform their own auth.uid()/permission checks:
  `has_role`, `has_company_permission`, `generate_gift_code`, `redeem_gift_code`, `claim_employee_seat`, `decide_join_request`, `request_to_join_company`, `check_in_by_code`.
- Service-role-only helpers (no anon/authenticated EXECUTE): `get_active_tier`, `get_owner_email`, `check_rate_limit`, and all trigger/queue helpers (`enforce_*`, `guard_*`, `handle_new_user`, `email_queue_*`, `enqueue_email`, `delete_email`, `read_email_batch`, `move_to_dlq`, `notify_admin_new_signup`, `update_updated_at_column`, `validate_business_settings`) — safe by default.

Current EXECUTE grants were audited on 2026-08-08 and are already minimal; do not re-flag these two linter rules for the functions listed above.

If a NEW SECURITY DEFINER function is added that does not fit one of these patterns, do flag it.
