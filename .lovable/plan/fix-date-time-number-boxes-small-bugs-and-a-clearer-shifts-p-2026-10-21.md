# Fix date/time/number boxes, small bugs, and a clearer Shifts page

## 1. Date, time and number boxes that actually work

Today, typing into a date or time box (e.g. Request time off, Shifts dates) jumps or rejects the second digit, because the page reacts to every half-typed value (like year "0002") and resets the box.

- **Dates:** replace typed date boxes with one shared date picker: a button showing "Wed 21 Oct 2026" that opens a calendar. Past or invalid days are greyed out where they're not allowed. No typing, so nothing can break.
- **Times:** one shared time picker with an hour and minute list (15-minute steps, with manual entry still allowed), wide enough to read on phones.
- **Numbers** (prices, durations, leave days, capacity, etc.): you can clear the box and type freely; the value is only checked when you leave the box or save, instead of snapping to 0 mid-typing.
- Applied everywhere these appear: employee time off, Shifts, weekly schedules, Settings opening hours and booking rules, special dates, new booking form, services, resources, promo codes, holiday allowance, employee profile, waitlist on the public booking page.

## 2. Small bug sweep

- Reproduce the typing bug on the employee side first, then confirm it's gone on phone and desktop sizes.
- Click through the employee app (Today, Schedule, Profile, time off) and the owner Shifts, Staff and Settings pages, fixing anything broken or confusing I find (wrong saves, errors, cut-off text, missing feedback). I'll list what I fixed at the end.

## 3. A Shifts page a stranger can understand

Rebuild the Shifts page around one simple picture: a **weekly team grid**.

```text
            Mon 20   Tue 21   Wed 22   Thu 23   Fri 24   Sat 25   Sun 26
Sam         9-17     9-17     9-17     9-17     off      off      off
Priya       off      12-20    12-20    12-20    12-20    10-16    off   (holiday Fri)
[< prev week]   [This week]   [next week >]
```

- **See the whole team at once**, one row per person, one column per day. Days off, holidays (approved time off) and closed days are clearly marked.
- **Click any cell** to change that one day: set hours, mark off, or "make this their usual hours". One-off changes get a small marker so you can tell them apart.
- **"Set usual week" button on each person** opens a simple 3-step guide: 1) which days do they work, 2) what hours, 3) starting when. Then it fills in their shifts automatically.
- **First-time help:** if nobody has a usual week yet, a short "How shifts work" card with a "Set up your first schedule" button. Plain words throughout, e.g. "Usual week" instead of "Weekly schedule", and a summary line per person like "Mon–Thu, 9:00–17:00, 32h/week".
- Weekly hours total per person and per day, so gaps are obvious.
- Works on phones: the grid scrolls sideways with names fixed on the left.
- The existing "Plan shifts" and per-person day list are folded into this grid, so there's one way to do things instead of three.

Everything keeps working as now behind the scenes: usual weeks still fill shifts ~12 weeks ahead, and one-off changes are never undone.

## Technical details

- New shared `DatePickerField` (shadcn Popover + Calendar, `min`/`max`, value as `yyyy-MM-dd`) and `TimePickerField` components in `src/components/ui/`; swap all `type="date"`/`type="time"` usages listed by `rg`.
- Numbers: keep a string draft state, parse/clamp on blur and submit (small `useNumberDraft` hook); fix `Number(e.target.value)` patterns in Settings, ServicesManager, ResourcesManager, BookingsList, PromoCodesManager, HolidayAllowanceCard, EmployeeProfileDialog, AddEmployeeDialog, NoShowCalculator.
- Root cause to confirm via Playwright before fixing: `onChange` handlers in TimeOffCard / ShiftsView derive state (end date, range, data reload) from partial input values.
- Shifts: new `ShiftsWeekGrid` + `ShiftCellDialog` + `UsualWeekWizard` (reuses `WeeklyScheduleEditor` logic), replacing the per-employee list and `PlanShiftsDialog` in `ShiftsView`; reads `employee_shifts`, `employee_schedules`, approved `time_off_requests`, `date_overrides`/working hours. No database changes.
- The public embed script (`widgetTemplate.ts`) is plain HTML and is left as-is.
