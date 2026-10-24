import { describe, it, expect } from "vitest";
import { cancelPolicyText, cancelDeadlineText } from "@/lib/cancelPolicy";

describe("cancel policy wording", () => {
  it("deposit-only booking states the deposit is non-refundable", () => {
    expect(cancelPolicyText({ hours: 24, deposit: 10 })).toBe(
      "Free cancellation up to 24 hours before your appointment. Cancel later than that and your £10.00 deposit is non-refundable.");
  });
  it("paid-in-full booking refunds everything except the deposit", () => {
    expect(cancelPolicyText({ hours: 48, deposit: 10, paidInFull: true })).toBe(
      "Free cancellation up to 48 hours before your appointment. Cancel later than that and you'll be refunded everything except the £10.00 deposit.");
  });
  it("deadline is shown in the business timezone (GMT, Nov)", () => {
    // 7 Nov 2099 is a Saturday; appointment 15:00 London, 25h window → Fri 6 Nov 14:00
    expect(cancelDeadlineText("2099-11-07T15:00:00Z", 25, "Europe/London")).toBe("Free cancellation until Fri 6 Nov, 14:00");
  });
  it("deadline respects BST", () => {
    // 15:00Z in July = 16:00 London; 2h before → 14:00
    expect(cancelDeadlineText("2099-07-10T15:00:00Z", 2, "Europe/London")).toContain(", 14:00");
  });
});
