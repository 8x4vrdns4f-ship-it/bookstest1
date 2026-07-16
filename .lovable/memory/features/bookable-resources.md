---
name: bookable-resources
description: Per-business bookable resources (tables/rooms/chairs) with capacity, party size, and client-pick or auto-assign
type: feature
---
Settings > Bookable Resources lets owners enable a resource picker on the widget.

business_settings columns: resources_enabled bool, resource_label text, party_size_enabled bool, assignment_mode ('client_pick'|'auto').
Table `resources(user_id, name, capacity, active, sort_order)` — owner manage; anon SELECT active for widget.
`bookings` and `pending_bookings` gained `resource_id` (FK resources, SET NULL) and `party_size` int.

Widget (src/lib/widgetTemplate.ts):
- Fetches get_widget_resources RPC. Filters resources by party size >= capacity.
- Slot busy logic: with resources_enabled, a slot is busy only if all fitting resources are occupied; when a specific resource is picked, only that resource's overlaps count.
- Sends resource_id + party_size to save-pending-booking.

save-pending-booking edge function:
- Auto mode (or missing resource_id): picks first active fitting resource with no overlap; 400 if none.
- Client pick: validates ownership, active, capacity >= party, no overlap.

charge-booking-deposit copies resource_id + party_size from pending to bookings on approval.

get_busy_slots RPC now returns resource_id (drop+create because signature changed).
