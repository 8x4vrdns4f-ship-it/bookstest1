# What's already built vs. what's missing

## Already built: bookable resources
Tables, chairs, rooms, booths are done.

- A `resources` list per business (name, capacity, active, order), managed in Settings.
- Settings switches confirmed in the database: `resources_enabled`, `resource_label` (so a restaurant says "Table", a barber says "Chair"), `party_size_enabled`, and `assignment_mode` (`client_pick` = customer chooses, `auto` = system assigns).
- The widget shows a party-size input, filters resources by capacity, greys out resources already taken for the chosen date/time/duration, and saves `resource_id` + `party_size` on the booking.
- Currently every business has `resources_enabled = false`, so nobody sees it until they turn it on in Settings.

## Not built yet: two things
1. **Choosing a specific staff member (the barber).** Bookings have an `assigned_employee_id` column and staff/shifts exist in the dashboard, but the widget never offers a staff picker and never sets that field. A customer cannot say "I want Sam."
2. **Choosing a service.** The widget hardcodes `service: 'Booking'` and only asks for a duration. There is no service/menu list (name, duration, price) a customer can pick from.

# Proposed work

## Step 1 — Service menu
- New `services` table per business: name, duration, price, active, sort order.
- Settings: add/edit/reorder services, with a toggle for businesses that don't need one.
- Widget: when services exist, the customer picks a service first and the duration is set automatically from it (duration buttons stay as the fallback when no menu is defined).

## Step 2 — Staff picker
- Settings: a toggle for "let customers choose a staff member", plus per-staff visibility (only staff marked bookable appear).
- Widget: after date and time, show available staff for that slot — filtered by their shifts and existing bookings — plus an "Any available" option.
- Save `assigned_employee_id` on the booking so it lands on the right person's calendar.

## Step 3 — Combine the rules
- Availability is checked across all three at once: service duration, staff working that slot, and resource free for the party size.
- Optional link between services and staff (which barber does which service) — worth doing only if you want it.

## Technical notes
- New `services` table with the standard owner-scoped access rules, plus read access for the public booking widget through a security-definer function like the existing `get_widget_resources`.
- New columns on `bookings`: `service_id`; on `business_settings`: `services_enabled`, `staff_pick_enabled`; on `employees`: `bookable`.
- Widget changes live in `src/lib/widgetTemplate.ts`; availability logic extends the existing `get_busy_slots` path to also return `assigned_employee_id`.
