---
name: dashboard-charts
description: Revenue stat, completed-today donut, switchable bookings bar chart
type: feature
---
`DashboardCharts.tsx` (recharts) shows three cards above the tabs:
1. **Revenue Generated** — `count(bookings where status='completed') * business_settings.deposit_amount`, currency from settings.
2. **Completed Today** — donut showing completed/today-total + percentage.
3. **Bookings** — bar chart with ToggleGroup (Today / Week / Month). Week = last 7 days by weekday name. Month = last 4 weeks (W1–W4).

Subscribes to bookings realtime channel — auto-updates.
