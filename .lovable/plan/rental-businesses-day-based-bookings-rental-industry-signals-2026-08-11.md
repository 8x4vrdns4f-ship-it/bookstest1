# Rental businesses: day-based bookings + rental industry signals

Two changes: show rental businesses in the landing-page trust signals, and let each business choose whether its calendar works in hours or in days.

## 1. Rental businesses on the landing page

- Add "Car rental" and "Equipment hire" chips to the "Trusted across" row (`SocialProofStrip`), with car and package icons.
- Add a "Rentals & Hire" tab to the industry section with a rental-specific pitch and three benefits: multi-day bookings with pickup and return dates, each vehicle or item as a bookable resource with real availability, and deposits taken up front through Stripe.

## 2. Booking mode: hourly or daily (per business)

A new **Booking mode** setting in Settings > Booking Preferences:

- **Hourly (default)** — exactly how everything works today. Nothing changes for existing businesses.
- **Daily** — the client picks a start date and an end date, then a pickup time on the start date.

How daily mode behaves, based on your answers:

- Price is **per day x number of days**. Service prices are treated as a daily rate, and the booking page shows the day count and the running total before checkout.
- The client still picks a **pickup time** on the start date, from the business's normal opening hours.
- A booking **blocks the whole date range** for the chosen vehicle/item, so it can't be double-booked on any day in between.
- Owners can set a **minimum and maximum rental length in days**.
- Deposit or pay-in-full works exactly as it does now, with the full amount calculated from the day count.

Where it shows up:

- **Booking widget / public booking page**: a date-range picker instead of a single date, a pickup time list, and a price summary line ("4 days x GBP 45 = GBP 180").
- **Dashboard**: multi-day bookings display as a date range on booking cards, lists, and the detail dialog, and span their full range in the calendar.
- **Staff and employee views**: the same date range shown wherever a booking date appears.

## Technical notes

- Migration: add `booking_mode` ('hourly' | 'daily', default 'hourly'), `min_rental_days`, `max_rental_days` to `business_settings`; add `end_date` (nullable date) and `rental_days` (nullable int) to `bookings` and `pending_bookings`. Expose `booking_mode` and the day limits from `get_widget_settings`.
- Availability: extend `get_busy_slots` (or add a range-aware companion) so multi-day bookings return every occupied day for a resource, and update the widget's conflict check to test range overlap rather than minute overlap.
- Price and validation: `save-pending-booking`, `create-booking-intent`, and `create-booking-checkout` recompute `days x service_price` server-side and reject ranges outside the configured min/max or that overlap an existing rental — never trust the client-sent amount.
- Frontend: `src/lib/widgetTemplate.ts` gets a daily branch (range picker + pickup times + totals); `src/pages/Settings.tsx` gets the booking-mode selector; booking date rendering is centralised in a small formatter used by the dashboard, calendar, and employee views.
- Landing changes are presentation-only: `src/components/landing/SocialProofStrip.tsx` and `src/components/landing/IndustrySections.tsx`.
