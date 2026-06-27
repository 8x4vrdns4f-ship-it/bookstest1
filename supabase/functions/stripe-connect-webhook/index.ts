// PUBLIC endpoint — receives Stripe webhooks. Verifies signature, then:
//  - checkout.session.completed -> promote pending_bookings -> bookings, email customer + owner
//  - charge.refunded            -> mark booking refunded, email customer
//  - account.updated            -> sync connect_accounts status
//
// Called via:
//   POST https://<project>.functions.supabase.co/stripe-connect-webhook?env=sandbox
//   POST https://<project>.functions.supabase.co/stripe-connect-webhook?env=live
//
// verify_jwt = false (Stripe does not send a Supabase JWT).

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

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
) {
  try {
    const { error } = await admin.functions.invoke("send-transactional-email", {
      body: { templateName, recipientEmail, idempotencyKey, templateData },
    });
    if (error) console.error("send-transactional-email error", { templateName, recipientEmail, error });
  } catch (e) {
    console.error("send-transactional-email threw", e);
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
    .select("auto_confirm, notify_new_booking, business_email, business_name")
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
    });
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

async function handleChargeRefunded(
  admin: ReturnType<typeof createClient>,
  charge: any,
) {
  const piId = charge.payment_intent as string | null;
  if (!piId) return;

  const { data: booking } = await admin
    .from("bookings")
    .select("*")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();
  if (!booking) {
    console.warn("no booking for refunded charge", piId);
    return;
  }
  if (booking.payment_status === "refunded") return;

  const refundId =
    charge.refunds?.data?.[0]?.id ||
    charge.latest_refund ||
    null;

  await admin
    .from("bookings")
    .update({
      payment_status: "refunded",
      refund_id: refundId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  // Owner's business name for email
  const { data: settings } = await admin
    .from("business_settings")
    .select("business_name, currency")
    .eq("user_id", booking.user_id)
    .maybeSingle();

  const refundedMinor =
    charge.amount_refunded ?? (booking.deposit_amount ? Math.round(Number(booking.deposit_amount) * 100) : 0);
  const currency = (charge.currency || settings?.currency || "GBP").toUpperCase();
  const refundAmount = refundedMinor ? formatMoney(refundedMinor, currency) : undefined;

  if (booking.client_email) {
    await sendEmail(admin, "booking-refunded", booking.client_email, `refund-${booking.id}-${refundId || "x"}`, {
      businessName: settings?.business_name || "the business",
      clientName: booking.client_name,
      service: booking.service,
      date: formatDate(booking.booking_date),
      time: formatTime(booking.booking_time),
      refundAmount,
    });
  }
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
  const secret = Deno.env.get(secretName);
  if (!secret) {
    console.error(`${secretName} not configured`);
    return new Response("Webhook secret not configured", { status: 500, headers: corsHeaders });
  }

  const body = await req.text();
  const sigHeader = req.headers.get("stripe-signature");
  const valid = await verifyStripeSignature(body, sigHeader, secret);
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
        await handleChargeRefunded(admin, event.data.object);
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
