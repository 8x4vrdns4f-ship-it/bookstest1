// Booking statuses that get a review request once the appointment date has passed.
export const REVIEW_REQUEST_STATUSES = ["confirmed", "completed"] as const;

export function isReviewRequestStatus(status: string | null | undefined): boolean {
  return (REVIEW_REQUEST_STATUSES as readonly string[]).includes(status ?? "");
}
