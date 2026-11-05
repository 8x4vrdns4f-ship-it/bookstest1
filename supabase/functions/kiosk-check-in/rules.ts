// Pure rules for public self check-in (unit-tested in index.test.ts).

export const GENERIC_FAILURE = "We couldn't check you in — please see reception.";
export const WINDOW_MINUTES = 30;

/** Last 6 alphanumeric characters, upper-cased, so a scanned kiosk URL works. */
export const normaliseCode = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < 6) return null;
  return cleaned.slice(-6);
};

export const normaliseCompanyCode = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toUpperCase();
  return /^BS-[A-Z0-9]{6}$/.test(c) ? c : null;
};

export type StatusDecision = "check_in" | "already" | "reject";
export const statusDecision = (status: string | null | undefined): StatusDecision =>
  status === "confirmed" ? "check_in" : status === "in_progress" ? "already" : "reject";

/** Local date (YYYY-MM-DD) and minutes since midnight in the given timezone. */
export const localNow = (now: Date, timeZone: string): { date: string; minutes: number } => {
  let tz = timeZone || "Europe/London";
  try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); } catch { tz = "Europe/London"; }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

/** True when booking is today (business tz) and now is within ±30 min of its start. */
export const insideWindow = (
  bookingDate: string, bookingTime: string, now: Date, timeZone: string,
): boolean => {
  const local = localNow(now, timeZone);
  if (bookingDate !== local.date) return false;
  const [h, m] = bookingTime.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  return Math.abs(local.minutes - (h * 60 + m)) <= WINDOW_MINUTES;
};

export const firstName = (name: string | null | undefined): string =>
  (name || "").trim().split(/\s+/)[0] || "there";
