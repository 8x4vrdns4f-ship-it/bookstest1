import { describe, it, expect, beforeEach } from "vitest";
import {
  handleChargeRefunded, handleDisputeOpened, handleDisputeSettled, handleInvoicePaid, type PaymentDeps,
} from "../../supabase/functions/_shared/payment-events";

type World = {
  booking: any; ledger: Map<string, any>; emails: string[]; alerts: string[];
  reversals: Array<{ transfer: string; amount: number; key: string }>; transfers: Array<{ amount: number; key: string }>;
  refunds: any[]; reverseFails: boolean; invoiceItems: any[]; pending: any[];
};

function deps(w: World): PaymentDeps {
  return {
    env: "sandbox",
    stripe: {
      listRefunds: async () => w.refunds,
      retrieveCharge: async () => ({ id: "ch_1", transfer: "tr_1" }),
      retrieveTransferReversalAmount: async (r) => Number(r.transfer_reversal?.amount ?? 0),
      createTransferReversal: async (transfer, amount, key) => {
        if (w.reverseFails) throw new Error("Insufficient funds in connected account");
        const prev = w.reversals.find((x) => x.key === key);
        if (!prev) w.reversals.push({ transfer, amount, key });
        return { id: `trr_${key}`, amount };
      },
      createTransfer: async (p) => {
        if (!w.transfers.find((x) => x.key === p.idempotencyKey)) w.transfers.push({ amount: p.amountMinor, key: p.idempotencyKey });
        return { id: "tr_back" };
      },
      retrieveInvoiceItem: async (id) => w.invoiceItems.find((x) => x.id === id),
    },
    db: {
      bookingByPaymentIntent: async () => w.booking,
      bookingByCharge: async () => w.booking,
      updateBooking: async (_id, patch) => { Object.assign(w.booking, patch); },
      addLedger: async (e) => { if (e.amountMinor && !w.ledger.has(e.stripeObjectId)) w.ledger.set(e.stripeObjectId, e); },
      ledgerHas: async (id) => w.ledger.has(id),
      connectAccountId: async () => "acct_biz",
      pendingInvoiceItems: async () => w.pending.filter((p) => p.status === "pending"),
      markInvoiceItemPaid: async (id) => { w.pending.find((p) => p.id === id)!.status = "paid"; },
      businessName: async () => "QA Biz",
      ownerEmail: async () => "owner@example.com",
    },
    sendEmail: async (t, _to, key) => { if (!w.emails.includes(`${t}|${key}`)) w.emails.push(`${t}|${key}`); },
    notifyAdmin: async (a) => { w.alerts.push(a.idempotencyKey); },
    formatMoney: (m) => `£${(m / 100).toFixed(2)}`,
  };
}

const sum = (w: World) => [...w.ledger.values()].reduce((s, e) => s + e.amountMinor, 0);
let w: World;
beforeEach(() => {
  w = {
    booking: { id: "b1", user_id: "u1", client_email: "c@example.com", client_name: "Jo", service: "Cut", booking_date: "2026-11-01", booking_time: "10:00", status: "confirmed", payment_status: "paid", refund_id: null, dispute_reversed_minor: null },
    ledger: new Map(), emails: [], alerts: [], reversals: [], transfers: [], refunds: [], reverseFails: false, invoiceItems: [], pending: [],
  };
});

describe("charge.refunded (Stripe-dashboard refunds)", () => {
  const charge = { id: "ch_1", payment_intent: "pi_1", amount: 1000, amount_refunded: 1000, currency: "gbp", transfer: "tr_1" };

  it("reverses the business's transfer when the dashboard refund didn't, with no shortfall", async () => {
    w.refunds = [{ id: "re_dash", amount: 1000, status: "succeeded", metadata: {} }];
    await handleChargeRefunded(deps(w), charge);
    expect(w.reversals).toEqual([{ transfer: "tr_1", amount: 1000, key: "rev-re_dash" }]);
    expect(sum(w)).toBe(0);
    expect(w.booking.payment_status).toBe("refunded");
    expect(w.emails).toEqual(["booking-refunded|refund-b1-re_dash"]);
  });

  it("puts the whole refund on the tab when the reversal fails", async () => {
    w.refunds = [{ id: "re_dash", amount: 1000, status: "succeeded", metadata: {} }];
    w.reverseFails = true;
    await handleChargeRefunded(deps(w), charge);
    expect(w.ledger.get("unrev-re_dash")?.amountMinor).toBe(1000);
  });

  it("partial dashboard refund → partially_refunded", async () => {
    w.refunds = [{ id: "re_p", amount: 400, status: "succeeded", metadata: {} }];
    await handleChargeRefunded(deps(w), { ...charge, amount_refunded: 400 });
    expect(w.booking.payment_status).toBe("partially_refunded");
  });

  it("an already-recorded refund of ours: no duplicate email, no reversal, status unchanged", async () => {
    Object.assign(w.booking, { payment_status: "refunded", refund_id: "re_ours" });
    w.refunds = [{ id: "re_ours", amount: 1000, status: "succeeded", metadata: { booksuite_booking_id: "b1" } }];
    await handleChargeRefunded(deps(w), charge);
    expect(w.emails).toEqual([]);
    expect(w.reversals).toEqual([]);
    expect(w.booking.payment_status).toBe("refunded");
  });

  it("replaying the same dashboard refund event is idempotent", async () => {
    w.refunds = [{ id: "re_dash", amount: 1000, status: "succeeded", metadata: {} }];
    await handleChargeRefunded(deps(w), charge);
    await handleChargeRefunded(deps(w), charge);
    expect(w.reversals.length).toBe(1);
    expect(w.emails.length).toBe(1);
  });

  it("skips bookings that are mid-refund (refund_processing lock)", async () => {
    w.booking.payment_status = "refund_processing";
    w.refunds = [{ id: "re_x", amount: 1000, status: "succeeded", metadata: {} }];
    await handleChargeRefunded(deps(w), charge);
    expect(w.reversals).toEqual([]);
    expect(w.booking.payment_status).toBe("refund_processing");
  });
});

describe("chargebacks", () => {
  const opened = {
    id: "dp_1", charge: "ch_1", amount: 1000, currency: "gbp", reason: "fraudulent", status: "needs_response",
    evidence_details: { due_by: 1767225600 },
    balance_transactions: [{ id: "txn_dispute", amount: -1000, fee: 2000, currency: "gbp" }],
  };

  it("opened: disputed, transfer reversed, real dispute fee on the tab, owner emailed, admin alerted", async () => {
    await handleDisputeOpened(deps(w), opened, "charge.dispute.created");
    expect(w.booking.payment_status).toBe("disputed");
    expect(w.reversals).toEqual([{ transfer: "tr_1", amount: 1000, key: "dispute-rev-dp_1" }]);
    expect(w.ledger.get("txn_dispute")?.amountMinor).toBe(2000);
    expect(sum(w)).toBe(2000);
    expect(w.emails).toEqual(["dispute-opened-owner|dispute-opened-dp_1"]);
    expect(w.alerts).toEqual(["dispute-opened-dp_1"]);
  });

  it("funds_withdrawn after created doesn't reverse or charge the fee twice", async () => {
    await handleDisputeOpened(deps(w), opened, "charge.dispute.created");
    await handleDisputeOpened(deps(w), opened, "charge.dispute.funds_withdrawn");
    expect(w.reversals.length).toBe(1);
    expect(sum(w)).toBe(2000);
    expect(w.emails.length).toBe(1);
  });

  it("reversal fails → disputed amount goes on the tab", async () => {
    w.reverseFails = true;
    await handleDisputeOpened(deps(w), opened, "charge.dispute.created");
    expect(w.ledger.get("dp_1-amount")?.amountMinor).toBe(1000);
    expect(sum(w)).toBe(3000);
  });

  it("won: business gets its £10 back and the returned fee is credited", async () => {
    await handleDisputeOpened(deps(w), opened, "charge.dispute.created");
    const won = { ...opened, status: "won", balance_transactions: [...opened.balance_transactions, { id: "txn_reinstated", amount: 1000, fee: -2000, currency: "gbp" }] };
    await handleDisputeSettled(deps(w), won, "charge.dispute.funds_reinstated");
    await handleDisputeSettled(deps(w), won, "charge.dispute.closed");
    expect(w.transfers).toEqual([{ amount: 1000, key: "dispute-return-dp_1" }]);
    expect(sum(w)).toBe(0);
    expect(w.booking.payment_status).toBe("paid");
    expect(w.emails).toContain("dispute-closed-owner|dispute-closed-dp_1");
  });

  it("lost: dispute_lost, business keeps carrying amount + fee", async () => {
    await handleDisputeOpened(deps(w), opened, "charge.dispute.created");
    await handleDisputeSettled(deps(w), { ...opened, status: "lost" }, "charge.dispute.closed");
    expect(w.booking.payment_status).toBe("dispute_lost");
    expect(w.transfers).toEqual([]);
    expect(sum(w)).toBe(2000);
  });
});

describe("invoice.paid collects the tab", () => {
  it("records 'collected' only for items on that invoice, once", async () => {
    w.pending = [
      { id: "p1", user_id: "u1", stripe_invoice_item_id: "ii_1", amount_minor: 700, currency: "GBP", status: "pending" },
      { id: "p2", user_id: "u1", stripe_invoice_item_id: "ii_2", amount_minor: 300, currency: "GBP", status: "pending" },
    ];
    w.invoiceItems = [{ id: "ii_1", invoice: "in_1" }, { id: "ii_2", invoice: "in_other" }];
    const r = await handleInvoicePaid(deps(w), { id: "in_1", customer: "cus_1" });
    await handleInvoicePaid(deps(w), { id: "in_1", customer: "cus_1" });
    expect(r.collected).toBe(700);
    expect(w.ledger.get("inv-ii_1")?.amountMinor).toBe(-700);
    expect(w.ledger.size).toBe(1);
  });
});
