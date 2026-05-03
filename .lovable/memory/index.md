# Memory: index.md
Updated: today

# Project Memory

## Core
Dark theme only, light blue accent, Plus Jakarta Sans. Bold logo: blue 'B' & 'S', white rest.
Global nav: Logo goes home, back arrow on all pages except landing.
Supabase Auth. Profiles auto-generated via DB trigger. business_settings + company_code auto-created on owner signup.
Distinct auth entry points: "Login" -> login form, "Try Now" -> signup form, "Join a Company" -> employee join.
Two dashboards: owners → /dashboard, employees → /employee-dashboard. Route picked by `routeAfterAuth.ts`.

## Memories
- [Design System](mem://style/design-system) — Dark theme, light blue accent, typography, and BookSuite logo branding
- [Landing Page Layout](mem://features/landing-page) — Hero section, feature cards, emoji strip, and pricing table
- [Global Navigation Rules](mem://features/navigation) — Logo routing and back button visibility
- [Pricing Tiers](mem://features/pricing-tiers) — BookSuite subscription plans and transaction fees
- [Supabase Auth & Profiles](mem://auth/user-profiles) — Supabase authentication and automated profile creation via DB trigger
- [Dashboard Overview](mem://features/dashboard-overview) — Layout and core components of the central management interface
- [External Calendar Widget](mem://features/external-calendar-widget) — Embeddable HTML/JS snippet for external booking synchronization
- [Auth UI Preferences](mem://auth/ui-preferences) — Password visibility and distinct entry points for login/signup
- [Employee Management](mem://features/employee-management) — Adding and managing staff via dashboard dialog
- [Staff Day View](mem://features/staff-day-view) — Staff tab: 3-column day view (In Progress/Free/Unavailable), shifts, assign bookings
- [Booking Lifecycle](mem://features/booking-lifecycle) — Pending → confirmed/declined flow with 6-char codes
- [Business Settings](mem://features/business-settings) — Per-business settings table (deposit, hours, name)
- [Settings Page & Employee Flow](mem://features/settings-page) — Full /settings page, company code, join-a-company, employee dashboard
- [Booking Detail & Assign](mem://features/booking-detail-and-assign) — Shared expandable detail dialog, assign employees, search bar, in_progress status, realtime
- [Date Overrides](mem://features/date-overrides) — Per-date business hours that beat weekly defaults
- [Dashboard Charts](mem://features/dashboard-charts) — Revenue stat, completed-today donut, switchable bookings bar chart
