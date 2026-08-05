# Pay deposit or pay in full

## How it works today (confirmed in the code)

- The client saves their card in the widget; nothing is charged yet.
- When the owner accepts the booking, only the **deposit** is charged (the amount set in Settings, minimum £10).
- The **service price** you set on a service is currently display-only — it shows in the widget so the client knows what it costs, and the rest is settled in person. Nothing else is taken automatically.

So your read is right: right now it is always "deposit now, balance on arrival".

## What you asked for

A setting in Settings that controls how the money is taken:

1. **Deposit only** (today's behaviour, the default) — deposit charged on acceptance, balance paid in person.
2. **Full payment** — the whole service price is charged on acceptance, nothing to pay on arrival.
3. **Let the client choose** — the widget shows two options and the client picks deposit-only or pay-in-full.

In the UI this is a toggle plus a follow-up choice, exactly as you described:

```text
[ ] Allow full payment at booking
     |
     +-- when on:
         ( ) Everyone pays in full
         ( ) Client chooses: deposit now, or pay in full
```

With the toggle off, nothing changes from today.

## One thing to confirm

When a client "pays in full", I'll charge the **service price total** — the deposit is counted as part of it, not on top. So a £30 skin fade with a £10 deposit charges £30 once, not £40. Say the word if you'd rather it be deposit + price.

## Behaviour details

- Full payment only makes sense when the service has a price. If a service has no price set (or the service menu is off), the widget falls back to deposit-only for that booking, whatever the setting says.
- Pay-in-full must be at least the deposit amount. If a service is priced below the deposit, the deposit amount is charged and the booking is treated as paid in full.
- The widget shows the exact amount clearly before the client confirms: "£10 due now, £20 on the day" or "£30 charged when your booking is accepted".
- The card is still only charged when the owner **accepts** — nothing is taken at request time, same as now.
- Confirmation emails state what was charged and what is still owed.
- The booking detail dialog and bookings list show "Paid in full" or "Deposit paid · £20 due", so staff know what to collect.
- Refunds keep working on whatever was actually charged.

## Technical notes

- `business_settings`: add `payment_mode` (`deposit` | `full` | `client_choice`, default `deposit`).
- `pending_bookings` and `bookings`: add `payment_option` (`deposit` | `full`), `service_price`, and `charge_amount` so the charged total is recorded independently of the deposit setting.
- `get_widget_settings` returns `payment_mode`; `get_widget_services` already returns price.
- Widget (`src/lib/widgetTemplate.ts`): render the payment-option choice when `client_choice` and the selected service has a price; send `payment_option` in the save call.
- `save-pending-booking`: validate `payment_option` against the business's `payment_mode` and re-read the service price server-side — never trust the amount from the browser.
- `charge-booking-deposit`: charge `charge_amount` instead of `deposit_amount`; platform fee stays a percentage of the amount actually charged.
- Settings UI: toggle plus radio group in the payments section.
- Emails: update the booking-confirmed template to show amount paid and balance due.
