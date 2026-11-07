import { describe, expect, it } from "vitest";
import { bookingDisplayDate } from "@/lib/bookingDisplayDate";

describe("booking calendar date display", () => {
  it("formats the requested date without shifting calendar days", () => {
    expect(bookingDisplayDate("2026-11-07")).toBe("Sat 7 Nov 2026");
  });
});