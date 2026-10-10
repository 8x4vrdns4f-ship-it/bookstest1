import { describe, it, expect } from "vitest";
import { noShowLoss } from "@/lib/noShowCalc";

describe("noShowLoss", () => {
  it("£25 x 3 no-shows a week over 50 weeks = £3,750 a year", () => {
    expect(noShowLoss(25, 3).yearly).toBe(3750);
  });
  it("deposits recover 70% of the yearly loss", () => {
    expect(noShowLoss(25, 3).recovered).toBe(2625);
  });
  it("negative inputs count as zero", () => {
    expect(noShowLoss(-5, 3).yearly).toBe(0);
  });
});
