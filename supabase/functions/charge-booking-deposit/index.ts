// OWNER-AUTHED — called from the dashboard when the business accepts a request.
// Creates an off-session PaymentIntent against the saved card, then promotes
// pending_bookings -> bookings on success.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";
import { notifyAdmin, money } from "../_shared/notify-admin.ts";
import { addLedgerEntry, outstandingMinor } from "../_shared/ledger.ts";
import { planApplicationFee, stripeFeeShortfallMinor } from "../_shared/ledger-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
function formatTime(t: string): string { return (t || "").slice(0, 5); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: uErr } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !userData?.user) throw new Error("Unauthorized");

    const { pending_id } = await req.json();
    if (!pending_id || typeof pending_id !== "string") throw new Error("Missing pending_id");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pending, error: pErr } = await admin
      .from("pending_bookings")
      .select("*")
      .eq("id", pending_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (pErr || !pending) throw new Error("Booking request not found");
    if (pending.status !== "awaiting_owner") throw new Error(`Already ${pending.status}`);
    if (!pending.stripe_payment_method_id || !pending.stripe_customer_id) {
      throw new Error("No saved payment method on this request");
    }

    // Mark as charging (advisory — prevents accidental double-accept from parallel UI).
    await admin.from("pending_bookings").update({ status: "charging" }).eq("id", pending.id);

    const env = resolveEnv((pending as any).payment_environment);
    const stripe = createStripeClient(env);
    const currency = String(pending.currency || "GBP").toLowerCase();
    const chargeTotal = Number((pending as any).charge_amount ?? pending.deposit_amount);
    const payOption = String((pending as any).payment_option || "deposit");
    const depositMinor = Math.round(chargeTotal * 100);
    const feeMinor = Math.round(Number(pending.platform_fee_amount) * 100);

    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, auto_confirm, business_email, notify_new_booking, company_code")
      .eq("user_id", pending.user_id)
      .maybeSingle();

    // BookSuite fee + standard Stripe fee + collection of any outstanding tab
    // (capped so the business keeps at least half of this charge).
    const owed = await outstandingMinor(admin, pending.user_id, env, currency);
    const plan = planApplicationFee({ chargeMinor: depositMinor, platformFeeMinor: feeMinor, outstandingMinor: owed });

    let intent;
    try {
      intent = await stripe.paymentIntents.create({
        amount: depositMinor,
        currency,
        customer: pending.stripe_customer_id,
        payment_method: pending.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        application_fee_amount: plan.applicationFeeMinor,
        transfer_data: { destination: pending.stripe_account_id },
        description: `${payOption === "full" ? "Payment" : "Deposit"} — ${settings?.business_name || "Booking"} (${pending.service})`,
        metadata: {
          pending_booking_id: pending.id, user_id: pending.user_id,
          booksuite_fee_minor: String(plan.platformFeeMinor),
          stripe_fee_included_minor: String(plan.stripeFeeIncludedMinor),
          ledger_collected_minor: String(plan.collectedMinor),
        },
      }, { idempotencyKey: `charge-pending-${pending.id}` });
    } catch (err: any) {
      // Off-session charge failed (declined, insufficient funds, SCA required).
      const msg = err?.raw?.message || err?.message || "Charge failed";
      await admin
        .from("pending_bookings")
        .update({ status: "charge_failed", charge_error: msg })
        .eq("id", pending.id);
      return new Response(
        JSON.stringify({ ok: false, code: err?.code || "charge_failed", message: msg }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (intent.status !== "succeeded") {
      await admin
        .from("pending_bookings")
        .update({ status: "charge_failed", charge_error: `PaymentIntent status ${intent.status}` })
        .eq("id", pending.id);
      return new Response(
        JSON.stringify({ ok: false, code: intent.status, message: `Payment not completed (${intent.status})` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const chargeId = (intent as any).latest_charge as string | null;

    // Stripe's ACTUAL processing fee for this charge.
    let actualStripeFeeMinor: number | null = null;
    let balanceTxnId: string | null = null;
    try {
      if (chargeId) {
        const ch: any = await stripe.charges.retrieve(chargeId, { expand: ["balance_transaction"] });
        const bt = ch.balance_transaction;
        if (bt && typeof bt === "object") { actualStripeFeeMinor = Number(bt.fee); balanceTxnId = bt.id; }
      }
    } catch (e) { console.error("balance transaction lookup failed", e); }
    const { data: codeRow } = await admin.rpc("generate_booking_code");

    // Compute token expiry: 7 days after appointment ends
    const bookingDateTime = new Date(`${pending.booking_date}T${pending.booking_time}`);
    const tokenExpires = new Date(bookingDateTime.getTime() + pending.duration_minutes * 60000 + 7 * 24 * 3600 * 1000);

    const { data: booking, error: bErr } = await admin
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
        status: "confirmed",
        confirmation_code: codeRow,
        stripe_payment_intent_id: intent.id,
        stripe_charge_id: chargeId,
        deposit_amount: pending.deposit_amount,
        platform_fee_amount: pending.platform_fee_amount,
        payment_environment: env,
        payment_status: "paid",
        client_token_expires_at: tokenExpires.toISOString(),
        payment_option: payOption,
        service_price: (pending as any).service_price ?? null,
        charge_amount: chargeTotal,
        resource_id: (pending as any).resource_id ?? null,
        party_size: (pending as any).party_size ?? null,
        end_date: (pending as any).end_date ?? null,
        rental_days: (pending as any).rental_days ?? null,
        promo_code_id: (pending as any).promo_code_id ?? null,
        stripe_fee_amount: actualStripeFeeMinor != null ? actualStripeFeeMinor / 100 : null,
        ledger_collected_amount: plan.collectedMinor ? plan.collectedMinor / 100 : null,
      })
      .select()
      .single();
    if (bErr) throw new Error(bErr.message);

    await admin.from("pending_bookings").delete().eq("id", pending.id);

    // Ledger: tab collected from this charge, and any Stripe fee above the standard rate.
    const ccy = String(pending.currency || "GBP").toUpperCase();
    if (plan.collectedMinor > 0) {
      await addLedgerEntry(admin, {
        userId: pending.user_id, bookingId: booking.id, type: "collected", amountMinor: -plan.collectedMinor,
        currency: ccy, environment: env, stripeObjectId: `collect-${intent.id}`, note: "Taken from booking payment",
      });
    }
    if (actualStripeFeeMinor != null && balanceTxnId) {
      const short = stripeFeeShortfallMinor(actualStripeFeeMinor, plan.stripeFeeIncludedMinor);
      if (short > 0) {
        await addLedgerEntry(admin, {
          userId: pending.user_id, bookingId: booking.id, type: "stripe_fee_shortfall", amountMinor: short,
          currency: ccy, environment: env, stripeObjectId: `fee-${balanceTxnId}`,
          note: `Card fee was higher than standard (premium/international card)`,
        });
      }
    }

    // Confirmation emails
    const businessName = settings?.business_name || "your business";
    const ccyLabel = String(pending.currency || "GBP").toUpperCase();
    const balanceDue = payOption === "full" ? 0 : Math.max(0, Number((pending as any).service_price ?? 0) - chargeTotal);
    const depositLabel = payOption === "full"
      ? `${ccyLabel} ${chargeTotal.toFixed(2)} (paid in full)`
      : `${ccyLabel} ${chargeTotal.toFixed(2)}${balanceDue > 0 ? ` — ${ccyLabel} ${balanceDue.toFixed(2)} due on the day` : ""}`;
    const checkInUrl = settings?.company_code && booking.confirmation_code
      ? `https://booksuite.online/kiosk/${settings.company_code}?code=${booking.confirmation_code}`
      : undefined;
    const manageUrl = booking.client_access_token
      ? `https://booksuite.online/booking/manage/${booking.client_access_token}`
      : undefined;
    try {
      if (booking.client_email) {
        await admin.functions.invoke("app-email", {
          body: {
            templateName: "booking-confirmed",
            businessUserId: pending.user_id,
            recipientEmail: booking.client_email,
            idempotencyKey: `booking-accepted-${booking.id}`,
            templateData: {
              businessName, clientName: booking.client_name, service: booking.service,
              date: formatDate(booking.booking_date), time: formatTime(booking.booking_time),
              confirmationCode: booking.confirmation_code, checkInUrl, depositAmount: depositLabel,
              manageUrl,
            },
          },
        });
      }
    } catch (e) { console.error("accept email failed", e); }

    await notifyAdmin(admin, {
      eventTitle: payOption === "full" ? "Booking paid in full" : "Booking deposit taken",
      eventSummary: "A business took a booking payment through BookSuite.",
      businessName: businessName,
      rows: [
        { label: "Client", value: booking.client_name },
        { label: "Service", value: booking.service },
        { label: "Appointment", value: `${formatDate(booking.booking_date)} at ${formatTime(booking.booking_time)}` },
        { label: "Amount charged", value: money(chargeTotal, pending.currency) },
        { label: "Platform fee", value: money(Number(pending.platform_fee_amount), pending.currency) },
        { label: "Environment", value: env },
      ],
      idempotencyKey: `booking-paid-${booking.id}`,
    });

    return new Response(
      JSON.stringify({ ok: true, booking_id: booking.id, confirmation_code: booking.confirmation_code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("charge-booking-deposit error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
