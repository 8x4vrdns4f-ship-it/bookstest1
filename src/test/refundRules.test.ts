import { describe, it, expect } from "vitest";
import { chargedAmount, quoteClientCancel, zonedTimeToUtcMs } from "../../supabase/functions/_shared/refund-rules";

const NOW = Date.UTC(2026, 6, 1, 9, 0); // 1 Jul 2026 09:00 UTC = 10:00 BST

describe("refund rules", () => {
  it("refund amount is charge_amount, falling back to deposit_amount", () => {
    expect(chargedAmount({ charge_amount: 60, deposit_amount: 5 })).toBe(60);
    expect(chargedAmount({ charge_amount: null, deposit_amount: 5 })).toBe(5);
  });

  it("cancelling outside the window refunds everything charged", () => {
    const q = quoteClientCancel(
      { payment_status: "paid", charge_amount: 60, deposit_amount: 5, booking_date: "2026-07-05", booking_time: "14:00" },
      { cancellationHours: 24, timeZone: "Europe/London", now: NOW },
    );
    expect(q.late).toBe(false);
    expect(q.refund).toBe(60);
  });

  it("late cancel of a deposit-only booking refunds nothing", () => {
    const q = quoteClientCancel(
      { payment_status: "paid", charge_amount: 5, deposit_amount: 5, booking_date: "2026-07-01", booking_time: "18:00" },
      { cancellationHours: 24, timeZone: "Europe/London", now: NOW },
    );
    expect(q.late).toBe(true);
    expect(q.refund).toBe(0);
    expect(q.kept).toBe(5);
  });

  it("late cancel of a paid-in-full booking refunds the charge minus the deposit", () => {
    const q = quoteClientCancel(
      { payment_status: "paid", charge_amount: 60, deposit_amount: 5, booking_date: "2026-07-01", booking_time: "18:00" },
      { cancellationHours: 24, timeZone: "Europe/London", now: NOW },
    );
    expect(q.refund).toBe(55);
    expect(q.kept).toBe(5);
  });

  it("uses the business timezone, so 14:00 London in summer is 13:00 UTC", () => {
    expect(zonedTimeToUtcMs("2026-07-01", "14:00", "Europe/London")).toBe(Date.UTC(2026, 6, 1, 13, 0));
    expect(zonedTimeToUtcMs("2026-01-10", "14:00", "Europe/London")).toBe(Date.UTC(2026, 0, 10, 14, 0));
  });

  it("window boundary respects BST: 24h-window booking at 10:30 BST tomorrow is not late at 10:00 BST today", () => {
    const q = quoteClientCancel(
      { payment_status: "paid", charge_amount: 5, deposit_amount: 5, booking_date: "2026-07-02", booking_time: "10:30" },
      { cancellationHours: 24, timeZone: "Europe/London", now: NOW },
    );
    expect(q.late).toBe(false);
  });
});
