---
name: date-overrides
description: Per-date business hours overrides (one-off, beats weekly defaults)
type: feature
---
Table `date_overrides (user_id, override_date, closed, open_time, close_time)` UNIQUE on (user_id, override_date).

Owner clicks a calendar day → DayScheduleDialog → "Hours" button → DateOverrideDialog upserts/deletes override row. RLS: owner manage own; anon SELECT for widget.

Widget loads overrides for next 60 days and `dayHoursFor()` consults them before falling back to `business_settings.working_hours[weekday]`.

Calendar view marks days with an override with a small "Custom" / "Closed" tag in the corner.
