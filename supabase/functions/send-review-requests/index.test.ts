import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isInReviewWindow, isReviewRequestStatus, planAllowsReviews, REVIEW_REQUEST_STATUSES } from "./status-rules.ts";

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

Deno.test("only bookings from the last 7 UK days (before today) get a review request", () => {
  const now = new Date("2026-11-03T12:00:00Z"); // UK date 2026-11-03
  assertEquals(isInReviewWindow("2026-11-02", now), true); // yesterday
  assertEquals(isInReviewWindow("2026-10-27", now), true); // 7 days ago
  assertEquals(isInReviewWindow("2026-10-26", now), false); // 8 days ago
  assertEquals(isInReviewWindow("2026-11-03", now), false); // today
  assertEquals(isInReviewWindow("2026-07-07", now), false); // old July booking
});

Deno.test("UK date is used, not UTC, around midnight in summer time", () => {
  const now = new Date("2026-07-14T23:30:00Z"); // already 15 July in London
  assertEquals(isInReviewWindow("2026-07-14", now), true);
  assertEquals(isInReviewWindow("2026-07-07", now), false);
});

Deno.test("only Gold and Platinum plans get review requests", () => {
  assertEquals(planAllowsReviews("gold"), true);
  assertEquals(planAllowsReviews("platinum"), true);
  assertEquals(planAllowsReviews("silver"), false);
  assertEquals(planAllowsReviews(null), false);
  assertEquals(planAllowsReviews(undefined), false);
  assertEquals(planAllowsReviews(""), false);
});
