# BookSuite — Roles, Approvals, Check-in & Emails

This is a large build. I'll deliver in 4 phases so each piece is testable before the next. Tell me to start phase 1 (or skip to a specific phase).

---

## Phase 1 — Roles & Join-request approval

**Database**
- New table `company_roles` — per-business role definitions. Built-in seeds: `owner`, `manager`, `receptionist`, `employee` (marked `is_builtin=true`, undeletable). Owners add custom roles in Settings → Roles (these inherit employee-level permissions).
- Add `role_id` (FK → company_roles) to `employees`.
- New table `employee_join_requests` — `id, user_id (business owner), requester_auth_id, requester_name, requester_email, requester_phone, status (pending/accepted/declined), decline_reason, assigned_role_id, created_at, decided_at, decided_by`.
- DB function `has_company_permission(auth_uid, business_user_id, perm)` — returns true if caller is owner OR has manager/receptionist/etc. role at that business. Used by RLS.
- RLS: requests visible to owner + anyone with `can_approve_requests` (owner + manager).

**Flow**
- `JoinCompanyDialog` → button label changes to **"Request to Join Company"**. Fields: company code, full name, email, phone, password. Creates auth user with `app_status='pending'` in metadata; inserts a `employee_join_requests` row; signs the user out and shows: *"Request submitted. You can't log in yet — we'll email you once approved."*
- Existing pre-add invite path stays (owner adds email → person joins → auto-approved, no request row).
- Login guard: if signed-in user has a pending request and no `employees.auth_user_id` link, redirect to `/pending-approval` page with the waiting message.
- Owner/manager dashboard: bell icon with pending count + a "Join Requests" card listing each request with **Accept** (opens role-picker dialog with the business's `company_roles`) and **Decline** (opens textarea for reason + Submit).
- On Accept: insert/update `employees` row linking `auth_user_id`, set `role_id`, mark request `accepted` → triggers welcome email.
- On Decline: mark request `declined` with reason → triggers decline email; user can re-request later.

**Notifications**
- In-app realtime toast + bell badge (Supabase Realtime on `employee_join_requests`).
- Email to owner + all managers (after Phase 4 wires email).

---

## Phase 2 — Role-based dashboards

- `/dashboard` (existing) = owner + manager. Manager hides "Settings → Danger Zone", "Roles", "Pricing/Billing" sections.
- `/dashboard` for **receptionist** = a focused view: today's bookings list + big **"Check-in"** button (camera scanner) + manual code entry + waiting-area list + assign-to-employee dropdown (filters employees on shift / "available now").
- `/employee-dashboard` (existing) = unchanged for `employee` and any custom role.
- `routeAfterAuth.ts` extended: looks up `employees.role_id` → returns correct route.
- Settings → new **Roles** accordion: list builtin (locked) + custom roles, add/rename/delete custom ones.
- Employee "available now" toggle (boolean column on `employees`) for receptionist's assign dropdown.

---

## Phase 3 — QR check-in flow

**Booking lifecycle**
- `confirmation_code` already exists. Generate QR client-side from a URL: `https://booksuite.online/checkin/:code` (uses `qrcode` npm lib). QR + code shown in the confirmation email and on a booking-detail page the customer can reopen via the email link.
- Add `checked_in_at` and `arrived_via` (`self_kiosk` | `reception`) columns to `bookings`.

**Self check-in kiosk**
- New public `/kiosk/:companyCode` route — full-screen camera scanner the business runs on a tablet at their entrance. Scanning a QR → POSTs to RPC `kiosk_check_in(company_code, booking_code)` → flips booking to `arrived` → shows "Welcome [Name]!" → realtime push to receptionist's screen → receptionist clicks "Send to waiting area" / "Assign to X" / "Mark in progress".

**Receptionist-led check-in**
- Receptionist dashboard: **Scan** button opens camera (`html5-qrcode`) OR types the 6-char code. Same booking pops up with action menu: *Waiting area*, *Assign on-call employee*, *Assign to specific employee*, *Mark in progress*, *Add note*. Choosing "Mark in progress" flips status; the popup actions are configurable so each business picks what to enable.

**Settings**
- New "Reception" accordion: toggle `self_checkin_enabled` (default off), `reception_checkin_enabled` (default on). At least one must be on.

---

## Phase 4 — Email automation (noreply@booksuite.online)

**Setup**
- Configure email domain `booksuite.online` (sender subdomain `notify.booksuite.online`, display From `noreply@booksuite.online`). I'll open the email setup dialog so you can paste the DNS records at your registrar.
- Once domain is added, set up email infrastructure + scaffold transactional templates.

**Templates**
1. `booking-confirmed` — sent on Accept. Contains: business name, date/time, service, deposit info, **QR code image** (rendered server-side with `qrcode` lib), 6-char fallback code, link to self check-in URL.
2. `booking-declined` — sent on Decline. Contains the reason the manager typed.
3. `booking-followup` — sent **45 min after booking flips to `completed`**. Contains link to business's external review URL (configured per business in Settings → Booking Preferences, new field `review_url`). If empty, follow-up email is skipped.
4. `join-request-approved` — sent when owner/manager accepts; includes role assigned + login link.
5. `join-request-declined` — sent on decline with reason.
6. `join-request-new` — sent to owner + all managers when a request is submitted.

**Scheduling**
- Confirmation/decline/approval/decline emails fire inline from the Accept/Decline handlers.
- Follow-up emails: pg_cron job every 5 min scans `bookings` where `status='completed'`, `completed_at <= now() - 45 min`, `followup_sent_at IS NULL`, and `business.review_url IS NOT NULL` → enqueues the email and stamps `followup_sent_at`.

---

## Tech notes

- Libs to add: `qrcode` (QR generation), `html5-qrcode` (camera scanner).
- All new tables get GRANTs + RLS in the same migration.
- Memory updates: new memory files for roles, join-requests, check-in flow, and email triggers.

---

## What I need from you to start

1. **Confirm phase order** — start with Phase 1, or rearrange?
2. **For Phase 4**, the email domain `booksuite.online` needs DNS records added at your registrar. Ready to do that when we reach Phase 4, or set it up upfront?
