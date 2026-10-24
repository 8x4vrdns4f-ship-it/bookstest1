// PUBLIC endpoint — receives Stripe webhooks. Verifies signature, then:
//  - checkout.session.completed -> promote pending_bookings -> bookings, email customer + owner
//  - charge.refunded            -> reconcile refunds (incl. Stripe-dashboard ones), ledger, email customer
//  - charge.dispute.*           -> chargebacks: reverse business transfer, ledger, emails
//  - invoice.paid               -> tab collected via subscription invoice
//  - account.updated            -> sync connect_accounts status
//
// Called via:
//   POST https://<project>.functions.supabase.co/stripe-connect-webhook?env=sandbox
//   POST https://<project>.functions.supabase.co/stripe-connect-webhook?env=live
//
// verify_jwt = false (Stripe does not send a Supabase JWT).

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cancelPolicyLine } from "../_shared/refund-rules.ts";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";
import { notifyAdmin } from "../_shared/notify-admin.ts";
import { addLedgerEntry } from "../_shared/ledger.ts";
import { handleChargeRefunded, handleDisputeOpened, handleDisputeSettled, handleInvoicePaid, type PaymentDeps } from "../_shared/payment-events.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function hex(buf: ArrayBuffer): string {
  const a = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < a.length; i++) s += a[i].toString(16).padStart(2, "0");
  return s;
}

async function verifyStripeSignature(
  body: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  let timestamp: string | undefined;
  const v1s: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k === "t") timestamp = v;
    if (k === "v1") v1s.push(v);
  }
  if (!timestamp || v1s.length === 0) return false;
  // 5-minute tolerance
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = hex(sig);
  return v1s.includes(expected);
}

function formatMoney(amountMinor: number | null | undefined, currency: string): string {
  if (amountMinor == null) return "";
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  }
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return d; }
}

function formatTime(t: string): string {
  return (t || "").slice(0, 5);
}

async function sendEmail(
  admin: ReturnType<typeof createClient>,
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, unknown>,
  businessUserId?: string,
) {
  try {
    const { error } = await admin.functions.invoke("app-email", {
      body: { templateName, recipientEmail, idempotencyKey, templateData, businessUserId },
    });
    if (error) console.error("app-email error", { templateName, recipientEmail, error });
  } catch (e) {
    console.error("app-email threw", e);
  }
}

async function handleCheckoutCompleted(
  admin: ReturnType<typeof createClient>,
  env: StripeEnv,
  session: any,
) {
  const sessionId = session.id as string;
  if (session.payment_status !== "paid") {
    console.log("checkout.session.completed but not paid", { sessionId, status: session.payment_status });
    return;
  }

  // Already promoted?
  const { data: existing } = await admin
    .from("bookings")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (existing) {
    console.log("booking already exists for session", sessionId);
    return;
  }

  const { data: pending } = await admin
    .from("pending_bookings")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (!pending) {
    console.warn("no pending_booking for session", sessionId);
    return;
  }

  // Resolve payment intent + charge
  const stripe = createStripeClient(env);
  let piId: string | null = null;
  let chargeId: string | null = null;
  const pi = session.payment_intent;
  if (typeof pi === "string") {
    piId = pi;
    try {
      const piObj = await stripe.paymentIntents.retrieve(pi);
      chargeId = (piObj as any).latest_charge || null;
    } catch (e) { console.warn("PI retrieve failed", e); }
  } else if (pi && typeof pi === "object") {
    piId = pi.id || null;
    chargeId = pi.latest_charge || null;
  }

  // Owner settings (auto_confirm, notify_new_booking, business email, name)
  const { data: settings } = await admin
    .from("business_settings")
    .select("auto_confirm, notify_new_booking, business_email, business_name, cancellation_hours")
    .eq("user_id", pending.user_id)
    .maybeSingle();

  const status = settings?.auto_confirm ? "confirmed" : "pending";

  const { data: codeRow } = await admin.rpc("generate_booking_code");
  const confirmationCode = codeRow as string;

  // Insert; rely on unique index for idempotency
  const { data: booking, error: insErr } = await admin
    .from("bookings")
    .insert({
      user_id: pending.user_id,
      client_name: pending.client_name,
      client_email: pending.client_email,
      service: pending.service,
      booking_date: pending.booking_date,
      booking_time: pending.booking_time,
      duration_minutes: pending.duration_minutes,
      notes: pending.notes,
      status,
      confirmation_code: confirmationCode,
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: piId,
      stripe_charge_id: chargeId,
      deposit_amount: pending.deposit_amount,
      platform_fee_amount: pending.platform_fee_amount,
      payment_environment: env,
      payment_status: "paid",
    })
    .select()
    .single();

  if (insErr) {
    // 23505 = race with verify-booking-payment, treat as success and skip emails
    if ((insErr as any).code === "23505") {
      console.log("race with verify-booking-payment, skipping emails", sessionId);
      return;
    }
    throw new Error(insErr.message);
  }

  // Clean up pending row
  await admin.from("pending_bookings").delete().eq("id", pending.id);

  // Owner's auth email (for notification)
  let ownerEmail = settings?.business_email || null;
  if (!ownerEmail) {
    try {
      const { data: userInfo } = await admin.auth.admin.getUserById(pending.user_id);
      ownerEmail = userInfo?.user?.email || null;
    } catch (e) { console.warn("getUserById failed", e); }
  }

  const depositAmount = booking.deposit_amount
    ? `${pending.currency || "GBP"} ${Number(booking.deposit_amount).toFixed(2)}`
    : undefined;
  const businessName = settings?.business_name || "your business";
  const checkInUrl = booking.confirmation_code
    ? `https://booksuite.online/checkin?code=${booking.confirmation_code}`
    : undefined;

  // 1) Customer confirmation
  if (booking.client_email) {
    await sendEmail(admin, "booking-confirmed", booking.client_email, `booking-paid-${booking.id}`, {
      businessName,
      clientName: booking.client_name,
      service: booking.service,
      date: formatDate(booking.booking_date),
      time: formatTime(booking.booking_time),
      confirmationCode: booking.confirmation_code,
      checkInUrl,
      depositAmount,
      manageUrl: booking.client_access_token ? `https://booksuite.online/booking/manage/${booking.client_access_token}` : undefined,
      policyText: cancelPolicyLine(settings?.cancellation_hours, booking.deposit_amount, String(pending.currency || "GBP").toUpperCase(), booking.payment_option === "full"),
    }, booking.user_id);
  }

  // 2) Owner notification (respect toggle)
  if (ownerEmail && settings?.notify_new_booking !== false) {
    await sendEmail(admin, "booking-paid-owner", ownerEmail, `owner-paid-${booking.id}`, {
      businessName,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      service: booking.service,
      date: formatDate(booking.booking_date),
      time: formatTime(booking.booking_time),
      confirmationCode: booking.confirmation_code,
      depositAmount,
    });
  }
}

function makeDeps(admin: ReturnType<typeof createClient>, env: StripeEnv): PaymentDeps {
  const stripe: any = createStripeClient(env);
  const one = async (q: any) => (await q.maybeSingle()).data ?? null;
  return {
    env,
    stripe: {
      listRefunds: async (charge) => (await stripe.refunds.list({ charge, limit: 100 })).data,
      retrieveCharge: (id) => stripe.charges.retrieve(id),
      retrieveTransferReversalAmount: async (r) => {
        if (typeof r.transfer_reversal === "object" && r.transfer_reversal?.amount != null) return Number(r.transfer_reversal.amount);
        const x = await stripe.refunds.retrieve(r.id, { expand: ["transfer_reversal"] });
        return Number(x.transfer_reversal?.amount ?? 0);
      },
      createTransferReversal: (transferId, amount, idempotencyKey, metadata) =>
        stripe.transfers.createReversal(transferId, { amount, metadata }, { idempotencyKey }),
      createTransfer: (p) => stripe.transfers.create(
        { amount: p.amountMinor, currency: p.currency, destination: p.destination, metadata: p.metadata },
        { idempotencyKey: p.idempotencyKey }),
      retrieveInvoiceItem: (id) => stripe.invoiceItems.retrieve(id),
    },
    db: {
      bookingByPaymentIntent: (pi) => one(admin.from("bookings").select("*").eq("stripe_payment_intent_id", pi)),
      bookingByCharge: (c) => one(admin.from("bookings").select("*").eq("stripe_charge_id", c)),
      updateBooking: async (id, patch) => {
        const { error } = await admin.from("bookings").update(patch as any).eq("id", id);
        if (error) throw error;
      },
      addLedger: (e) => addLedgerEntry(admin as any, e as any),
      ledgerHas: async (id) => !!(await one(admin.from("business_ledger").select("id").eq("stripe_object_id", id))),
      connectAccountId: async (uid) => (await one(admin.from("connect_accounts").select("stripe_account_id").eq("user_id", uid).eq("environment", env)))?.stripe_account_id ?? null,
      pendingInvoiceItems: async (cust) => ((await admin.from("ledger_invoice_items").select("*").eq("stripe_customer_id", cust).eq("environment", env).eq("status", "pending")).data ?? []) as any,
      markInvoiceItemPaid: async (id) => { await admin.from("ledger_invoice_items").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", id); },
      businessName: async (uid) => (await one(admin.from("business_settings").select("business_name").eq("user_id", uid)))?.business_name || "the business",
      ownerEmail: async (uid) => { const { data } = await admin.rpc("get_owner_email", { _user_id: uid }); return (data as string | null) || null; },
    },
    sendEmail: (t, to, key, data, biz) => sendEmail(admin, t, to, key, data, biz),
    notifyAdmin: (a) => notifyAdmin(admin as any, a),
    formatMoney: (m, c) => formatMoney(m, c),
  };
}

async function handleAccountUpdated(
  admin: ReturnType<typeof createClient>,
  account: any,
) {
  const stripeAccountId = account.id as string;
  await admin
    .from("connect_accounts")
    .update({
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      details_submitted: !!account.details_submitted,
      country: account.country || null,
      default_currency: account.default_currency || null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", stripeAccountId);

  if (account.charges_enabled && account.details_submitted) {
    const { data: row } = await admin
      .from("connect_accounts")
      .select("user_id")
      .eq("stripe_account_id", stripeAccountId)
      .maybeSingle();
    let businessName = "";
    if (row?.user_id) {
      const { data: bs } = await admin
        .from("business_settings")
        .select("business_name")
        .eq("user_id", (row as any).user_id)
        .maybeSingle();
      businessName = (bs as any)?.business_name || "";
    }
    await notifyAdmin(admin, {
      eventTitle: "Payout account ready",
      eventSummary: "A business completed payout onboarding and can now accept payments.",
      businessName,
      rows: [
        { label: "Country", value: account.country || "—" },
        { label: "Currency", value: String(account.default_currency || "—").toUpperCase() },
      ],
      idempotencyKey: `connect-ready-${stripeAccountId}`,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const rawEnv = url.searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Missing/invalid env query param", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  const secretName =
    env === "sandbox" ? "STRIPE_WEBHOOK_SECRET_SANDBOX" : "STRIPE_WEBHOOK_SECRET_LIVE";
  // Two endpoints per env: Connect (connected-account events) and platform
  // (charges, refunds, disputes, invoices on BookSuite's own account).
  const secrets = [Deno.env.get(secretName), Deno.env.get(`${secretName}_PLATFORM`)].filter(Boolean) as string[];
  const secret = secrets[0];
  if (!secret) {
    console.error(`${secretName} not configured`);
    return new Response("Webhook secret not configured", { status: 500, headers: corsHeaders });
  }

  const body = await req.text();
  const sigHeader = req.headers.get("stripe-signature");
  let valid = false;
  for (const sec of secrets) { if (await verifyStripeSignature(body, sigHeader, sec)) { valid = true; break; } }
  if (!valid) {
    console.error("invalid stripe signature");
    return new Response("invalid signature", { status: 400, headers: corsHeaders });
  }

  let event: any;
  try { event = JSON.parse(body); } catch {
    return new Response("invalid json", { status: 400, headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(admin, env, event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(makeDeps(admin, env), event.data.object);
        break;
      case "charge.dispute.created":
      case "charge.dispute.funds_withdrawn":
        await handleDisputeOpened(makeDeps(admin, env), event.data.object, event.type);
        break;
      case "charge.dispute.funds_reinstated":
      case "charge.dispute.closed":
        await handleDisputeSettled(makeDeps(admin, env), event.data.object, event.type);
        break;
      case "invoice.paid":
        await handleInvoicePaid(makeDeps(admin, env), event.data.object);
        break;
      case "account.updated":
        await handleAccountUpdated(admin, event.data.object);
        break;
      default:
        console.log("unhandled event", event.type);
    }
  } catch (e) {
    console.error("webhook handler error", event.type, e);
    // Return 200 so Stripe doesn't retry indefinitely on logic errors,
    // EXCEPT for transient infra issues we want to retry — keep simple: log + 500
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
