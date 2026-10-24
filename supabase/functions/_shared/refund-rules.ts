// Pure refund/cancellation rules — no Deno or network imports, so they can be
// unit-tested from the web project (src/test/refundRules.test.ts).

export type MoneyBooking = {
  payment_status?: string | null;
  payment_option?: string | null;
  charge_amount?: number | string | null;
  deposit_amount?: number | string | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The amount the client was actually charged (charge_amount, else deposit_amount). */
export function chargedAmount(b: MoneyBooking): number {
  const c = b.charge_amount != null ? Number(b.charge_amount) : NaN;
  if (Number.isFinite(c) && c > 0) return round2(c);
  const d = Number(b.deposit_amount ?? 0);
  return Number.isFinite(d) && d > 0 ? round2(d) : 0;
}

/** Whether there is captured money that a refund could return. */
export function hasRefundablePayment(b: MoneyBooking): boolean {
  return (b.payment_status === "paid" || b.payment_status === "refund_failed") && chargedAmount(b) > 0;
}

/** Converts a wall-clock date/time in an IANA timezone to a UTC timestamp (ms). */
export function zonedTimeToUtcMs(date: string, time: string, timeZone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  let tz = timeZone || "Europe/London";
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch { tz = "Europe/London"; }
  const offsetAt = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(ms));
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - ms;
  };
  let ts = wall - offsetAt(wall);
  ts = wall - offsetAt(ts);
  return ts;
}

export type ClientCancelQuote = {
  late: boolean;
  hoursUntil: number;
  cancellationHours: number;
  charged: number;
  refund: number;
  kept: number;
};

/**
 * Client self-cancel: outside the window → full refund of what was charged.
 * Inside the window → the deposit is kept; anything paid above it is refunded.
 */
export function quoteClientCancel(
  b: MoneyBooking & { booking_date: string; booking_time: string },
  opts: { cancellationHours?: number | null; timeZone?: string | null; now?: number },
): ClientCancelQuote {
  const cancellationHours = opts.cancellationHours ?? 24;
  const appt = zonedTimeToUtcMs(b.booking_date, b.booking_time, opts.timeZone || "Europe/London");
  const hoursUntil = (appt - (opts.now ?? Date.now())) / 3_600_000;
  const late = hoursUntil < cancellationHours;
  const charged = hasRefundablePayment(b) ? chargedAmount(b) : 0;
  let refund = charged;
  if (late) {
    const deposit = Math.max(0, Number(b.deposit_amount ?? 0) || 0);
    refund = round2(Math.max(0, charged - deposit));
  }
  return { late, hoursUntil, cancellationHours, charged, refund, kept: round2(charged - refund) };
}

export function formatMoney(amount: number, currency = "GBP"): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: (currency || "GBP").toUpperCase() }).format(amount);
  } catch {
    return `${(currency || "GBP").toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/** Stripe idempotency key: same booking + amount + attempt → same refund, so a
 *  double click can never refund twice; a genuine retry after a failure bumps
 *  the attempt count so it isn't blocked by the failed attempt's key. */
export function refundIdempotencyKey(bookingId: string, amountMajor: number, failedAttempts: number): string {
  const pence = Math.round(amountMajor * 100);
  return failedAttempts > 0 ? `refund-${bookingId}-${pence}-retry${failedAttempts}` : `refund-${bookingId}-${pence}`;
}

