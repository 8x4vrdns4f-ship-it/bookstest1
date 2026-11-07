import { describe, expect, it } from "vitest";
import { claimDecision } from "../../supabase/functions/charge-booking-deposit/claim-rules";

describe("accept charge claim decision", () => {
  it("rejects a lost or already handled claim with 409", () => {
    expect(claimDecision(null)).toEqual({ claimed: false, status: 409, message: "This request is already being processed or has been handled" });
  });
  it("uses the claimed attempt for the same network retry", () => {
    const row = { id: "request-1", charge_attempts: 1 };
    expect(claimDecision(row)).toEqual({ claimed: true, row, idempotencyKey: "accept-request-1-1" });
    expect(claimDecision({ ...row })).toEqual(claimDecision(row));
  });
  it("gives a deliberate retry a new key", () => {
    const first = claimDecision({ id: "request-1", charge_attempts: 1 });
    const retry = claimDecision({ id: "request-1", charge_attempts: 2 });
    expect(retry).toMatchObject({ claimed: true, idempotencyKey: "accept-request-1-2" });
    if (first.claimed && retry.claimed) expect(retry.idempotencyKey).not.toBe(first.idempotencyKey);
  });
});