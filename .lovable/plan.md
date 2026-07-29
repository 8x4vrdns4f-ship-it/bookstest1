## Owner replies to reviews

Let business owners publicly respond to each review from the Reviews dashboard. Replies show alongside the review wherever it's displayed.

### Database
- Migration on `public.reviews`:
  - Add `owner_reply text` (nullable)
  - Add `owner_reply_at timestamptz` (nullable)
- Add RLS policy: owners can `UPDATE` their own reviews (only these two columns should be writable in practice — enforced via a `BEFORE UPDATE` trigger that blocks changes to `rating`, `comment`, `booking_id`, `user_id`, `created_at`).
- Extend `get_public_business_info` is not needed; instead add a small `SECURITY DEFINER` RPC `get_public_reviews(_user_id uuid, _limit int)` returning `rating, comment, owner_reply, owner_reply_at, created_at, client_first_name` so the public widget/landing can show replies safely (no direct table exposure).

### UI — Reviews dashboard (`src/pages/dashboard/ReviewsPage.tsx`)
- Each review card gets:
  - If no reply: a "Reply" button that opens an inline textarea (max 1000 chars) + Save / Cancel.
  - If reply exists: a highlighted "Your reply" block underneath with edit / delete actions and the reply timestamp.
- Optimistic update on save via `supabase.from('reviews').update({...}).eq('id', r.id)`; toast on error.

### Public surface
- `PublicBooking.tsx` rating badge already exists — no change needed there.
- (Optional, small) If reviews are ever surfaced publicly later, they'd read from the new `get_public_reviews` RPC. For this feature we only wire the RPC; no new public UI is added unless requested.

### Files touched
- 1 migration (columns + policy + guard trigger + RPC + GRANTs)
- `src/pages/dashboard/ReviewsPage.tsx` (reply UI + mutation)
- `src/integrations/supabase/types.ts` regenerates automatically after migration

### Out of scope
- Email notifying the reviewer that a reply was posted
- Character-limit enforcement server-side beyond a simple `length <= 1000` check in the trigger
- Public display of reviews on the landing page
