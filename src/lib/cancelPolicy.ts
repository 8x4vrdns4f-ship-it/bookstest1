// Client-facing cancellation policy wording. Keep in sync with the inline copy
// in widgetTemplate.ts and supabase/functions/_shared/cancel-policy.ts.
const money = (n: number, c = "GBP") => {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: c || "GBP" }).format(n); }
  catch { return `${c} ${n.toFixed(2)}`; }
};

export function cancelPolicyText(opts: { hours: number | null | undefined; deposit: number | null | undefined; currency?: string | null; paidInFull?: boolean }): string {
  const hours = opts.hours ?? 24;
  const dep = Number(opts.deposit || 0);
  const head = `Free cancellation up to ${hours} hours before your appointment.`;
  if (dep <= 0) return head;
  const d = money(dep, opts.currency || "GBP");
  return opts.paidInFull
    ? `${head} Cancel later than that and you'll be refunded everything except the ${d} deposit.`
    : `${head} Cancel later than that and your ${d} deposit is non-refundable.`;
}

/** "Free cancellation until Fri 7 Nov, 14:00" in the business's timezone. */
export function cancelDeadlineText(startIso: string, hours: number | null | undefined, timeZone?: string | null): string {
  const deadline = new Date(new Date(startIso).getTime() - (hours ?? 24) * 3600_000);
  const tz = timeZone || "Europe/London";
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(deadline);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const verb = deadline.getTime() < Date.now() ? "Free cancellation ended" : "Free cancellation until";
  return `${verb} ${g("weekday")} ${g("day")} ${g("month")}, ${g("hour")}:${g("minute")}`;
}
