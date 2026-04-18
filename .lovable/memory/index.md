# Project Memory

## Core
Dark theme, light blue accent, Plus Jakarta Sans. Bold logo: blue 'B' & 'S', white rest.
Global nav: Logo goes home, back arrow on all pages except landing. Login button hidden when logged in.
Supabase Auth. Profiles auto-generated via DB trigger.
Distinct auth entry points: "Login" -> login form, "Try Now" -> signup form.
Bookings: pending bookings get Accept/Decline. Accept generates a unique 6-char code (alphabet ABCDEFGHJKLMNPQRSTUVWXYZ23456789) shown to staff at the venue.
Email sending stubbed — domain not configured. Wire send-transactional-email after domain setup.

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
- [Business Settings](mem://features/business-settings) — Per-business deposit, hours, business name; min £10 deposit
- [Booking Lifecycle](mem://features/booking-lifecycle) — Pending → Accept (generates code) / Decline; widget creates pending bookings
