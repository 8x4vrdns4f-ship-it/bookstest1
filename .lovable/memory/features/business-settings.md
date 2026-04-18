---
name: business-settings
description: Per-business configurable deposit, hours, and name stored in business_settings table
type: feature
---
Table `business_settings` (one row per user_id):
- `deposit_amount` (numeric, min £10 enforced by trigger, default £10)
- `platform_fee_percent` (numeric, default 5.00 — platform's cut on Stripe Connect later)
- `day_start_hour` / `day_end_hour` (integers, used by widget to render time slots)
- `business_name` (text, shown on widget header)

RLS: owner read/write own row; anon SELECT allowed (widget needs hours + deposit + name).
Edited via `BusinessSettingsDialog` in dashboard header.
Migration trigger validates: deposit ≥ 10, end_hour > start_hour, hours in 0–24.
