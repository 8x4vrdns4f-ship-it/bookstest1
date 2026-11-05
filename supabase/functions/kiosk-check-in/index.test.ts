import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { insideWindow, normaliseCode, normaliseCompanyCode, statusDecision, firstName } from "./rules.ts";

Deno.test("code normalisation keeps last 6 characters, upper-cased", () => {
  assertEquals(normaliseCode("x7k2p9"), "X7K2P9");
  assertEquals(normaliseCode("https://booksuite.online/kiosk/BS-ABCDEF?code=X7K2P9"), "X7K2P9");
  assertEquals(normaliseCode(" ab12 "), null);
  assertEquals(normaliseCode(42), null);
  assertEquals(normaliseCompanyCode("bs-abcdef"), "BS-ABCDEF");
  assertEquals(normaliseCompanyCode("ABCDEF"), null);
});

Deno.test("status rule: confirmed checks in, in_progress is already, others rejected", () => {
  assertEquals(statusDecision("confirmed"), "check_in");
  assertEquals(statusDecision("in_progress"), "already");
  for (const s of ["pending", "completed", "cancelled", "declined", "cancelled_by_client", "no_show", null]) {
    assertEquals(statusDecision(s as string | null), "reject");
  }
});

Deno.test("time window: exactly 30 min before/after allowed, 31 not (London summer time)", () => {
  // 2026-07-10 14:00 London = 13:00 UTC
  const tz = "Europe/London";
  assertEquals(insideWindow("2026-07-10", "14:00:00", new Date("2026-07-10T12:30:00Z"), tz), true);
  assertEquals(insideWindow("2026-07-10", "14:00:00", new Date("2026-07-10T13:30:00Z"), tz), true);
  assertEquals(insideWindow("2026-07-10", "14:00:00", new Date("2026-07-10T12:29:00Z"), tz), false);
  assertEquals(insideWindow("2026-07-10", "14:00:00", new Date("2026-07-10T13:31:00Z"), tz), false);
});

Deno.test("time window uses the business timezone and requires today", () => {
  // 09:00 in New York (EST, UTC-5) on 2026-12-01 = 14:00 UTC
  const now = new Date("2026-12-01T14:10:00Z");
  assertEquals(insideWindow("2026-12-01", "09:00", now, "America/New_York"), true);
  assertEquals(insideWindow("2026-12-01", "09:00", now, "Europe/London"), false);
  assertEquals(insideWindow("2026-12-02", "09:00", now, "America/New_York"), false);
  // invalid timezone falls back to London (GMT in December)
  assertEquals(insideWindow("2026-12-01", "14:00", now, "Not/AZone"), true);
});

Deno.test("only the first name is returned", () => {
  assertEquals(firstName("Jane Smith"), "Jane");
  assertEquals(firstName(""), "there");
});
