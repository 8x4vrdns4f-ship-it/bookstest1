import { describe, expect, it } from "vitest";
import { buildJoinPath, getInviteCompanyCode, getSafeRelativeDestination } from "@/lib/inviteFlow";

describe("employee invite flow", () => {
  it("uses a company parameter that cannot collide with the auth callback code", () => {
    expect(buildJoinPath("bs-abc123", "person+staff@example.com")).toBe(
      "/join?company=BS-ABC123&email=person%2Bstaff%40example.com",
    );
  });

  it("reads current and legacy invite links", () => {
    expect(getInviteCompanyCode(new URLSearchParams("company=BS-NEW123"))).toBe("BS-NEW123");
    expect(getInviteCompanyCode(new URLSearchParams("code=BS-OLD123&code=auth-code"))).toBe("BS-OLD123");
  });

  it("only accepts same-origin relative return destinations", () => {
    expect(getSafeRelativeDestination("/join?company=BS-ABC123")).toBe("/join?company=BS-ABC123");
    expect(getSafeRelativeDestination("https://example.com/join")).toBe("");
    expect(getSafeRelativeDestination("//example.com/join")).toBe("");
  });
});