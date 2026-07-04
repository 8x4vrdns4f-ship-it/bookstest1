## Owner reviews dashboard

Give business owners a place to see the ratings and comments clients leave after appointments.

### New page & route
- New page `src/pages/dashboard/ReviewsPage.tsx`, route `/dashboard/reviews`.
- Add a "Reviews" entry in `DashboardSidebar` with a star icon.

### Data
- Uses the existing `public.reviews` table (already has RLS letting owners read their own).
- Query: `reviews` joined with `bookings` (service, client_name, booking_date) filtered by `user_id = auth.uid()`, ordered by `created_at desc`.
- If per-employee breakdown is wanted, join `bookings.assigned_employee_id` → `employees.name`.

### UI sections
1. **Summary cards** (top row, using existing `StatCard`):
   - Average rating (1 decimal, star icon).
   - Total reviews.
   - Reviews this month.
   - 5-star share (%).
2. **Rating distribution** — a compact bar for each of 5→1 stars showing count and % of total.
3. **Per-staff breakdown** (only if the business has employees): table of employee name, avg rating, review count. Sorted best-first.
4. **Recent reviews list** — cards showing stars, client first name, service, date, and comment. Paginated (20/page) or "Load more".
5. **Empty state** when no reviews yet: friendly message plus a hint that reviews arrive automatically after appointments.

### Small touches
- Reuse `PageHeader`, `SectionCard`, and the shared dashboard shell for visual consistency.
- Locked behind the same subscription/tier gate the rest of the dashboard uses (no new tier changes).

### Out of scope
- Owner replies to reviews.
- Editing/deleting reviews.
- Public per-employee rating display.
- Email digests of new reviews.
