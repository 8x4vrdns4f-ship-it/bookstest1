// Stripe webhook handlers for money movements on booking payments:
// dashboard refunds, chargebacks/disputes and tab collection via subscription
// invoices. Pure logic over injected deps so it can be tested with fixture
// events (src/test/paymentEvents.test.ts). All amounts in minor units.
import { disputeFeeMinor, disputeFeeReturnedMinor, refundShortfallMinor, refundedStatus } from "./ledger-rules.ts";

export type LedgerEntry = {
  userId: string; bookingId?: string | null; type: string; amountMinor: number;
  currency: string; environment: string; stripeObjectId: string; note?: string;
};

export interface PaymentDeps {
  env: "sandbox" | "live";
  stripe: {
    listRefunds(chargeId: string): Promise<any[]>;
    retrieveCharge(chargeId: string): Promise<any>;
    retrieveTransferReversalAmount(refund: any): Promise<number>;
    createTransferReversal(transferId: string, amountMinor: number, idempotencyKey: string, metadata: Record<string, string>): Promise<{ id: string; amount: number }>;
    createTransfer(p: { amountMinor: number; currency: string; destination: string; idempotencyKey: string; metadata: Record<string, string> }): Promise<{ id: string }>;
    retrieveInvoiceItem(id: string): Promise<any>;
  };
  db: {
    bookingByPaymentIntent(pi: string): Promise<any | null>;
    bookingByCharge(chargeId: string): Promise<any | null>;
    updateBooking(id: string, patch: Record<string, unknown>): Promise<void>;
    addLedger(e: LedgerEntry): Promise<void>;
    ledgerHas(stripeObjectId: string): Promise<boolean>;
    connectAccountId(userId: string): Promise<string | null>;
    pendingInvoiceItems(customerId: string): Promise<Array<{ id: string; user_id: string; stripe_invoice_item_id: string; amount_minor: number; currency: string }>>;
    markInvoiceItemPaid(id: string): Promise<void>;
    businessName(userId: string): Promise<string>;
    ownerEmail(userId: string): Promise<string | null>;
  };
  sendEmail(templateName: string, to: string, idempotencyKey: string, data: Record<string, unknown>, businessUserId?: string): Promise<void>;
  notifyAdmin(a: { eventTitle: string; eventSummary?: string; businessName?: string; rows?: Array<{ label: string; value: string }>; idempotencyKey: string }): Promise<void>;
  formatMoney(minor: number, currency: string): string;
}

const ccy = (c: unknown) => String(c || "gbp").toUpperCase();
const isOurs = (r: any) => !!r?.metadata?.booksuite_booking_id;

/** charge.refunded — reconcile refunds, incl. ones made in the Stripe dashboard. */
export async function handleChargeRefunded(d: PaymentDeps, charge: any): Promise<{ newRefunds: string[] }> {
  const pi = charge.payment_intent as string | null;
  if (!pi) return { newRefunds: [] };
  const booking = await d.db.bookingByPaymentIntent(pi);
  if (!booking) return { newRefunds: [] };
  // One of our refund functions is mid-flight; it records the result itself.
  if (booking.payment_status === "refund_processing") return { newRefunds: [] };

  const refunds = (await d.stripe.listRefunds(charge.id)).filter((r) => r.status === "succeeded" || r.status === "pending");
  const external = refunds.filter((r) => !isOurs(r));
  const currency = ccy(charge.currency);
  const newRefunds: string[] = [];

  for (const r of external) {
    const fresh = !(await d.db.ledgerHas(r.id)) && !(await d.db.ledgerHas(`unrev-${r.id}`));
    let reversed = 0;
    try {
      reversed = r.transfer_reversal ? await d.stripe.retrieveTransferReversalAmount(r) : 0;
      if (!reversed && charge.transfer) {
        const rev = await d.stripe.createTransferReversal(String(charge.transfer), Number(r.amount), `rev-${r.id}`,
          { booksuite_booking_id: booking.id, booksuite_refund_id: r.id });
        reversed = Number(rev.amount);
      }
    } catch (e) {
      console.error("dashboard refund reversal failed", r.id, e);
      reversed = 0;
    }
    if (reversed === 0) {
      await d.db.addLedger({ userId: booking.user_id, bookingId: booking.id, type: "unreversed_refund", amountMinor: Number(r.amount),
        currency, environment: d.env, stripeObjectId: `unrev-${r.id}`, note: "Refund made in Stripe, not recovered from business balance" });
    } else {
      await d.db.addLedger({ userId: booking.user_id, bookingId: booking.id, type: "refund_shortfall",
        amountMinor: refundShortfallMinor(Number(r.amount), reversed), currency, environment: d.env, stripeObjectId: r.id,
        note: "Refund larger than amount recovered from business" });
    }
    if (fresh) newRefunds.push(r.id);
  }

  const status = refundedStatus(Number(charge.amount_refunded ?? 0), Number(charge.amount ?? 0));
  const latest = refunds[0]?.id ?? booking.refund_id ?? null;
  if (booking.payment_status !== status || (newRefunds.length && booking.refund_id !== latest)) {
    await d.db.updateBooking(booking.id, {
      payment_status: status,
      refund_id: latest,
      refund_amount: Number(charge.amount_refunded ?? 0) / 100,
      refund_error: null,
      updated_at: new Date().toISOString(),
    });
  }

  if (booking.client_email) {
    for (const id of newRefunds) {
      const r = external.find((x) => x.id === id)!;
      await d.sendEmail("booking-refunded", booking.client_email, `refund-${booking.id}-${id}`, {
        businessName: await d.db.businessName(booking.user_id),
        clientName: booking.client_name, service: booking.service,
        date: booking.booking_date, time: String(booking.booking_time || "").slice(0, 5),
        refundAmount: d.formatMoney(Number(r.amount), currency),
      }, booking.user_id);
    }
  }
  return { newRefunds };
}

async function disputeBooking(d: PaymentDeps, dispute: any) {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  let b = chargeId ? await d.db.bookingByCharge(chargeId) : null;
  if (!b && dispute.payment_intent) b = await d.db.bookingByPaymentIntent(String(dispute.payment_intent));
  return { booking: b, chargeId };
}

/** charge.dispute.created / funds_withdrawn — pull the money back from the business. */
export async function handleDisputeOpened(d: PaymentDeps, dispute: any, eventType: string) {
  const { booking, chargeId } = await disputeBooking(d, dispute);
  if (!booking) return { handled: false };
  const currency = ccy(dispute.currency);
  const amount = Number(dispute.amount);

  const patch: Record<string, unknown> = { payment_status: "disputed", dispute_id: dispute.id, updated_at: new Date().toISOString() };
  if (booking.dispute_reversed_minor == null) {
    let reversed = 0;
    try {
      const charge = await d.stripe.retrieveCharge(String(chargeId));
      const transferId = typeof charge.transfer === "string" ? charge.transfer : charge.transfer?.id;
      if (transferId) {
        const rev = await d.stripe.createTransferReversal(transferId, amount, `dispute-rev-${dispute.id}`,
          { booksuite_booking_id: booking.id, booksuite_dispute_id: dispute.id });
        reversed = Number(rev.amount);
      }
    } catch (e) { console.error("dispute reversal failed", dispute.id, e); }
    patch.dispute_reversed_minor = reversed;
    if (reversed < amount) {
      await d.db.addLedger({ userId: booking.user_id, bookingId: booking.id, type: "dispute_amount", amountMinor: amount - reversed,
        currency, environment: d.env, stripeObjectId: `${dispute.id}-amount`, note: "Chargeback not recovered from business balance" });
    }
  }
  await d.db.updateBooking(booking.id, patch);

  for (const bt of (dispute.balance_transactions || []) as any[]) {
    const fee = disputeFeeMinor([bt]);
    if (fee > 0) {
      await d.db.addLedger({ userId: booking.user_id, bookingId: booking.id, type: "dispute_fee", amountMinor: fee,
        currency: ccy(bt.currency || dispute.currency), environment: d.env, stripeObjectId: bt.id, note: "Stripe chargeback fee" });
    }
  }

  if (eventType === "charge.dispute.created") {
    const to = await d.db.ownerEmail(booking.user_id);
    const businessName = await d.db.businessName(booking.user_id);
    const dueBy = dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000).toISOString().slice(0, 10) : "";
    const data = {
      businessName, clientName: booking.client_name, service: booking.service,
      when: `${booking.booking_date} ${String(booking.booking_time || "").slice(0, 5)}`,
      amount: d.formatMoney(amount, currency), dueBy, reason: String(dispute.reason || "").replace(/_/g, " "),
      confirmationCode: booking.confirmation_code || "", checkedIn: ["in_progress", "completed"].includes(booking.status),
    };
    if (to) await d.sendEmail("dispute-opened-owner", to, `dispute-opened-${dispute.id}`, data);
    await d.notifyAdmin({
      eventTitle: "Chargeback opened", eventSummary: `${data.amount} disputed (${data.reason || "no reason given"})`, businessName,
      rows: [
        { label: "Client", value: booking.client_name }, { label: "Booking", value: `${booking.service} · ${data.when}` },
        { label: "Evidence due", value: dueBy || "—" }, { label: "Dispute", value: dispute.id }, { label: "Booking id", value: booking.id },
      ],
      idempotencyKey: `dispute-opened-${dispute.id}`,
    });
  }
  return { handled: true };
}

/** charge.dispute.funds_reinstated / closed — settle the outcome. */
export async function handleDisputeSettled(d: PaymentDeps, dispute: any, eventType: string) {
  const { booking } = await disputeBooking(d, dispute);
  if (!booking) return { handled: false };
  const currency = ccy(dispute.currency);
  const won = dispute.status === "won" || eventType === "charge.dispute.funds_reinstated";
  const lost = dispute.status === "lost";

  if (won) {
    const reversed = Number(booking.dispute_reversed_minor ?? 0);
    if (reversed > 0) {
      const dest = await d.db.connectAccountId(booking.user_id);
      if (dest) {
        try {
          await d.stripe.createTransfer({ amountMinor: reversed, currency: currency.toLowerCase(), destination: dest,
            idempotencyKey: `dispute-return-${dispute.id}`, metadata: { booksuite_booking_id: booking.id, booksuite_dispute_id: dispute.id } });
        } catch (e) { console.error("dispute return transfer failed", dispute.id, e); }
      }
    }
    const unrecovered = Number(dispute.amount) - reversed;
    if (unrecovered > 0 && await d.db.ledgerHas(`${dispute.id}-amount`)) {
      await d.db.addLedger({ userId: booking.user_id, bookingId: booking.id, type: "dispute_won_credit", amountMinor: -unrecovered,
        currency, environment: d.env, stripeObjectId: `${dispute.id}-amount-won`, note: "Chargeback won — amount cleared" });
    }
    for (const bt of (dispute.balance_transactions || []) as any[]) {
      const back = disputeFeeReturnedMinor([bt]);
      if (back > 0) {
        await d.db.addLedger({ userId: booking.user_id, bookingId: booking.id, type: "dispute_won_credit", amountMinor: -back,
          currency: ccy(bt.currency || dispute.currency), environment: d.env, stripeObjectId: bt.id, note: "Chargeback fee returned by Stripe" });
      }
    }
    await d.db.updateBooking(booking.id, { payment_status: "paid", updated_at: new Date().toISOString() });
  } else if (lost) {
    await d.db.updateBooking(booking.id, { payment_status: "dispute_lost", updated_at: new Date().toISOString() });
  } else if (eventType === "charge.dispute.closed") {
    // warning_closed / inquiry closed without funds moving.
    await d.db.updateBooking(booking.id, { payment_status: "paid", updated_at: new Date().toISOString() });
  }

  if (eventType === "charge.dispute.closed") {
    const to = await d.db.ownerEmail(booking.user_id);
    if (to) {
      await d.sendEmail("dispute-closed-owner", to, `dispute-closed-${dispute.id}`, {
        businessName: await d.db.businessName(booking.user_id), clientName: booking.client_name, service: booking.service,
        when: `${booking.booking_date} ${String(booking.booking_time || "").slice(0, 5)}`,
        amount: d.formatMoney(Number(dispute.amount), currency), outcome: won ? "won" : lost ? "lost" : "closed",
      });
    }
  }
  return { handled: true, won, lost };
}

/** invoice.paid — tab items raised on a subscription invoice are now collected. */
export async function handleInvoicePaid(d: PaymentDeps, invoice: any) {
  const customer = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customer) return { collected: 0 };
  let collected = 0;
  for (const row of await d.db.pendingInvoiceItems(customer)) {
    let item: any;
    try { item = await d.stripe.retrieveInvoiceItem(row.stripe_invoice_item_id); } catch { continue; }
    const inv = typeof item?.invoice === "string" ? item.invoice : item?.invoice?.id;
    if (inv !== invoice.id) continue;
    await d.db.addLedger({ userId: row.user_id, type: "collected", amountMinor: -Number(row.amount_minor), currency: ccy(row.currency),
      environment: d.env, stripeObjectId: `inv-${row.stripe_invoice_item_id}`, note: `Collected on BookSuite invoice ${invoice.number || invoice.id}` });
    await d.db.markInvoiceItemPaid(row.id);
    collected += Number(row.amount_minor);
  }
  return { collected };
}
