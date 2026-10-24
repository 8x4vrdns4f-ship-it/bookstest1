import { describe, it, expect } from "vitest";
import {
  amountToInvoiceMinor, disputeFeeMinor, disputeFeeReturnedMinor, ledgerBalanceMinor, planApplicationFee,
  refundShortfallMinor, refundedStatus, standardStripeFeeMinor, stripeFeeShortfallMinor,
} from "../../supabase/functions/_shared/ledger-rules";

describe("Stripe processing fee is passed to the business", () => {
  it("standard UK card fee is 1.5% + 20p", () => {
    expect(standardStripeFeeMinor(1000)).toBe(35); // £10 → 35p
    expect(standardStripeFeeMinor(3000)).toBe(65); // £30 → 65p
  });
  it("application fee = BookSuite fee + standard Stripe fee when nothing is owed", () => {
    const p = planApplicationFee({ chargeMinor: 1000, platformFeeMinor: 125, outstandingMinor: 0 });
    expect(p.applicationFeeMinor).toBe(160);
    expect(p.stripeFeeIncludedMinor).toBe(35);
    expect(p.collectedMinor).toBe(0);
  });
  it("records a shortfall only when Stripe's actual fee is higher", () => {
    expect(stripeFeeShortfallMinor(55, 35)).toBe(20);
    expect(stripeFeeShortfallMinor(35, 35)).toBe(0);
    expect(stripeFeeShortfallMinor(30, 35)).toBe(0); // never charge more than the actual fee
  });
});

describe("collecting the tab from booking charges", () => {
  it("adds the outstanding balance to the fee", () => {
    const p = planApplicationFee({ chargeMinor: 1000, platformFeeMinor: 125, outstandingMinor: 200 });
    expect(p.collectedMinor).toBe(200);
    expect(p.applicationFeeMinor).toBe(360);
  });
  it("caps collection so the business keeps at least 50% of the charge", () => {
    const p = planApplicationFee({ chargeMinor: 1000, platformFeeMinor: 125, outstandingMinor: 2000 });
    expect(p.applicationFeeMinor).toBe(500);
    expect(p.collectedMinor).toBe(340);
    expect(1000 - p.applicationFeeMinor).toBeGreaterThanOrEqual(500);
  });
});

describe("refunds", () => {
  it("shortfall = refund − transfer reversal", () => {
    expect(refundShortfallMinor(1000, 1000)).toBe(0);
    expect(refundShortfallMinor(1000, 600)).toBe(400);
  });
  it("only fully refunded when amount_refunded equals the charge", () => {
    expect(refundedStatus(1000, 1000)).toBe("refunded");
    expect(refundedStatus(500, 1000)).toBe("partially_refunded");
  });
});

describe("ledger balance and invoicing", () => {
  const now = Date.parse("2026-11-30T00:00:00Z");
  const rows = [
    { amount_minor: 1000, created_at: "2026-11-01T00:00:00Z" }, // 29 days old
    { amount_minor: 500, created_at: "2026-11-25T00:00:00Z" },  // 5 days old
    { amount_minor: -300, created_at: "2026-11-26T00:00:00Z" }, // collected
  ];
  it("balance is the sum of entries", () => {
    expect(ledgerBalanceMinor(rows)).toBe(1200);
  });
  it("invoices only debt older than 14 days, minus credits and anything already invoiced", () => {
    expect(amountToInvoiceMinor(rows, 0, now)).toBe(700);
    expect(amountToInvoiceMinor(rows, 700, now)).toBe(0);
  });
});

describe("dispute fees use Stripe's balance transactions", () => {
  it("fee charged and fee returned", () => {
    expect(disputeFeeMinor([{ fee: 2000 }])).toBe(2000);
    expect(disputeFeeReturnedMinor([{ fee: -2000 }])).toBe(2000);
    expect(disputeFeeReturnedMinor([{ fee: 2000 }])).toBe(0);
  });
});
