# What's already built vs. what's missing

## Already built: bookable resources
Tables, chairs, rooms, booths are done.

- A `resources` list per business (name, capacity, active, order), managed in Settings.
- Settings switches confirmed in the database: `resources_enabled`, `resource_label` (so a restaurant says "Table", a barber says "Chair"), `party_size_enabled`, and `assignment_mode` (`client_pick` = customer chooses, `auto` = system assigns).
- The widget shows a party-size input, filters resources by capacity, greys out resources already taken for the chosen date/time/duration, and saves `resource_id` + `party_size` on the booking.
- Currently every business has `resources_enabled = false`, so nobody sees it until they turn it on in Settings.

## Already built: owner assigns staff to a booking
Confirmed in the code — the booking detail dialog and the reception view both let the owner pick a staff member for a booking and save it to `assigned_employee_id`, and the assigned name already shows on the bookings list, calendar, and reviews.

## Not built yet: one thing
**Choosing a service.** The widget hardcodes `service: 'Booking'` and only asks for a duration. There is no service/menu list (name, duration, price) a customer can pick from.

# Proposed work

## Step 1 — Service menu
- New `services` table per business: name, duration, price, active, sort order.
- Settings: add/edit/reorder services, with a toggle for businesses that don't need one.
- Widget: when services exist, the customer picks a service first and the duration is set automatically from it (duration buttons stay as the fallback when no menu is defined).

## Step 2 — Assignment polish (small)
No customer-facing staff picker — a barbershop's chairs are just resources, which is already covered.
- Add the same "assign staff" control to the bookings list row menu, so the owner doesn't have to open the detail dialog every time.
- Show the assigned staff member alongside the resource on the calendar, so it's clear who is covering which chair or table.

## Step 3 — Combine the rules
- Availability is checked across both at once: the service's duration and whether a resource is free for that party size at that time.

## Technical notes
- New `services` table with the standard owner-scoped access rules, plus read access for the public booking widget through a security-definer function like the existing `get_widget_resources`.
- New column on `bookings`: `service_id`; on `business_settings`: `services_enabled`.
- Widget changes live in `src/lib/widgetTemplate.ts`; availability keeps using the existing `get_busy_slots` + resource capacity logic, with the selected service supplying the duration.
