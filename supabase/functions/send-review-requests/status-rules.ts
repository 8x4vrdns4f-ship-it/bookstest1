// Booking statuses that get a review request once the appointment date has passed.
export const REVIEW_REQUEST_STATUSES = ["confirmed", "completed"] as const;

export function isReviewRequestStatus(status: string | null | undefined): boolean {
  return (REVIEW_REQUEST_STATUSES as readonly string[]).includes(status ?? "");
}

// How many days back (UK date) a booking can be and still get a review request.
export const REVIEW_WINDOW_DAYS = 7;

/** UK (Europe/London) calendar date as YYYY-MM-DD. */
export function ukDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

/** Window: booking_date >= from AND booking_date < before (both UK dates). */
export function reviewDateWindow(now: Date): { from: string; before: string } {
  const before = ukDate(now);
  const d = new Date(`${before}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - REVIEW_WINDOW_DAYS);
  return { from: d.toISOString().slice(0, 10), before };
}

export function isInReviewWindow(bookingDate: string, now: Date): boolean {
  const { from, before } = reviewDateWindow(now);
  return bookingDate >= from && bookingDate < before;
}
