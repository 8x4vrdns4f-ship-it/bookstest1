# Tier-based rate limits for the Embed AI assistant

Limit how often each owner can ask the embed-assistant AI based on their subscription tier, to keep AI credit usage sustainable.

## Limits

| Tier | Allowance |
| --- | --- |
| Silver | 1 request per calendar month |
| Gold | 1 request per 7 days (rolling) |
| Platinum | 1 request per 24 hours (rolling) |
| No subscription | Blocked |

## Backend

- Add a new table `embed_assistant_usage` (`user_id`, `created_at`) — one row per successful AI call.
- In `supabase/functions/embed-assistant/index.ts`, before calling the model:
  1. Resolve the caller's active tier via the existing `get_active_tier(user_id)` function.
  2. Count rows in `embed_assistant_usage` for that user within the tier's window:
     - silver → since `date_trunc('month', now())`
     - gold → since `now() - interval '7 days'`
     - platinum → since `now() - interval '24 hours'`
  3. If count ≥ 1, return HTTP 429 with a JSON body `{ error, tier, next_available_at }` describing when they can try again. No AI credits are spent.
  4. Otherwise call the model, and on success insert a usage row.
- No subscription → 403 with a clear "Subscribe to use the embed AI assistant" message.

## Frontend

- `src/components/dashboard/EmbedWidgetDialog.tsx`:
  - On open, fetch the user's tier + last usage timestamp to show a small status line above the textarea, e.g. "Silver plan · 1 AI request per month · next available 12 Jan".
  - Disable the Generate button (with reason text) when the user is over their limit.
  - The existing 402/error toast handling already added stays; extend it to surface the new 429 message ("You've used your monthly/weekly/daily AI request. Next available …").

## Technical notes

- New migration creates `embed_assistant_usage` with RLS: owners can `select` their own rows; `insert` happens only from the edge function via service role (no insert policy needed for authenticated users).
- Grants: `GRANT SELECT ON public.embed_assistant_usage TO authenticated; GRANT ALL ON public.embed_assistant_usage TO service_role;`
- Reuse `get_active_tier` (already exists) — no new SQL function required.
- "Next available" computed in the edge function and returned, so the UI doesn't reimplement window math.
