export type CancelQuote = { late: boolean; cancellation_hours: number; charged: number; refund: number; kept: number; currency: string };

const fmtMoney = (n: number, c: string) => {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: c || "GBP" }).format(n); }
  catch { return `${c} ${n.toFixed(2)}`; }
};

export function quoteText(q: CancelQuote | null): string {
  if (!q) return "Checking your cancellation terms…";
  if (q.late && q.kept > 0) {
    return `You're cancelling within ${q.cancellation_hours} hours of your appointment. Your ${fmtMoney(q.kept, q.currency)} deposit is non-refundable.` +
      (q.refund > 0 ? ` The remaining ${fmtMoney(q.refund, q.currency)} will be refunded.` : "");
  }
  if (q.refund > 0) return `${fmtMoney(q.refund, q.currency)} will be refunded to your original payment method.`;
  return "Your booking will be cancelled.";
}

export function cancelResultText(d: { refunded?: number; refund_failed?: boolean; kept?: number; currency?: string }): string {
  const c = d.currency || "GBP";
  const parts: string[] = [];
  if (d.refund_failed) parts.push("Your refund couldn't be processed automatically — the business has been told and will refund you directly.");
  else if (d.refunded) parts.push(`${fmtMoney(d.refunded, c)} has been refunded. It can take 5–10 working days to appear.`);
  if (d.kept) parts.push(`Your ${fmtMoney(d.kept, c)} deposit was non-refundable.`);
  return parts.join(" ");
}

