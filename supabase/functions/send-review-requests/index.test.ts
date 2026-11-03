import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isReviewRequestStatus, REVIEW_REQUEST_STATUSES } from "./status-rules.ts";

Deno.test("confirmed and completed bookings get a review request", () => {
  assertEquals(isReviewRequestStatus("confirmed"), true);
  assertEquals(isReviewRequestStatus("completed"), true);
  assertEquals([...REVIEW_REQUEST_STATUSES].sort(), ["completed", "confirmed"]);
});

Deno.test("other statuses never get a review request", () => {
  for (const s of ["no_show", "cancelled", "cancelled_by_client", "declined", "in_progress", "pending", "", null]) {
    assertEquals(isReviewRequestStatus(s as string | null), false, `status ${s}`);
  }
});
