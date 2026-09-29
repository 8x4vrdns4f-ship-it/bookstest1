# Holiday allowance for employees

## What the owner gets
- **Settings → Team**: a new "Holiday allowance" field (default 28 days a year). The holiday year always resets on 1 January.
- **Add Employee dialog**: a "Holiday days per year" box, already filled in with the business default. The owner can change it for that one person before sending the invite.
- **Staff page**: each employee's profile shows "18 of 28 days left · 2 pending", and the owner can edit their allowance later.
- **Bank holidays**: the owner picks their country once, and that country's bank holidays are skipped automatically. Days the owner already marked as closed in the calendar are skipped too.

## What the employee sees
- On their Profile tab, above the time-off requests: **"You have 10 days left of your 28-day holiday"**, plus "3 days pending approval" as a separate line and a small progress bar.
- When they pick dates for a new request, they see how many working days it uses ("This uses 4 days") and a warning if it goes over what they have left. The request can still be sent, so the manager has the final say.
- The approval card for managers shows the same day count and the employee's remaining balance.

## How days are counted
- Only the employee's own working days count — a day is deducted only if the business is open that day AND the employee normally works that day (from their shifts in `employee_shifts`, or a weekly pattern of which days they work). An employee who works Mon–Thu is never charged for a Friday.
- Bank holidays and closed days are skipped.
- Only approved leave comes off the balance. Pending leave is shown separately. Declined or cancelled leave is never counted.
- Leave that runs across New Year is split between the two years.

## Technical details
- Migration: add `business_settings.default_leave_days int default 28` and `holiday_country text` (ISO code, nullable), plus `employees.annual_leave_days int` (nullable, meaning "use the business default"). Validation trigger keeps values between 0 and 366.
- New `public_holidays` table (country, date, name) that everyone can read, filled by a small edge function from the free Nager.Date API for this year and next. It runs when the owner picks a country.
- New SECURITY DEFINER function `leave_working_days(employee_id, start, end)` that counts days where the business is open (from `working_hours`), the employee has a shift that day (from `employee_shifts`), minus `public_holidays` for the business's country and closed `date_overrides`. If the employee has no shifts on file, it falls back to the business's open days so counting never breaks.
- New function `get_leave_balance(employee_id, year)` that returns allowance, used (approved), pending and remaining. The employee can call it for themselves, and owners or users with the approve permission can call it for anyone. The frontend never does the maths itself.
- UI changes: `AddEmployeeDialog`, Settings team section, `EmployeeProfileDialog`, `TimeOffCard`, `TimeOffRequestsCard`, plus new text in all 5 languages.
- Verify: test employee with a 28-day allowance, one approved Mon–Fri week (5 days) and one pending request. Check "23 left · X pending" shows for both the employee and the owner, and that a UK bank holiday inside a request is skipped.
