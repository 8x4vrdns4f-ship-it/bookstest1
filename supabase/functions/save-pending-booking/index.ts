// PUBLIC endpoint — called by the widget after stripe.confirmSetup succeeds.
// Persists a pending_bookings row with the saved PaymentMethod and notifies the owner.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveEnv } from "../_shared/stripe.ts";

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
    const body = await req.json();
    const {
      userId,
      service,
      booking_date,
      booking_time,
      duration_minutes,
      client_name,
      client_email,
      notes,
      environment,
      stripe_customer_id,
      stripe_payment_method_id,
      stripe_setup_intent_id,
    } = body;

    const env = resolveEnv(environment);
    const bad = (msg: string) => new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const timeRe = /^\d{2}:\d{2}(:\d{2})?$/;

    if (typeof userId !== "string" || !uuidRe.test(userId)) return bad("Invalid business id");
    if (typeof client_email !== "string" || client_email.length > 254 || !emailRe.test(client_email)) return bad("Invalid email");
    if (typeof client_name !== "string" || !client_name.trim() || client_name.length > 200) return bad("Invalid name");
    if (typeof service !== "string" || !service.trim() || service.length > 200) return bad("Invalid service");
    if (typeof booking_date !== "string" || !dateRe.test(booking_date)) return bad("Invalid date");
    if (typeof booking_time !== "string" || !timeRe.test(booking_time)) return bad("Invalid time");
    const dur = Number(duration_minutes ?? 60);
    if (!Number.isInteger(dur) || dur < 15 || dur > 480) return bad("Invalid duration");
    if (notes != null && (typeof notes !== "string" || notes.length > 2000)) return bad("Notes too long");
    if (typeof stripe_customer_id !== "string" || !stripe_customer_id.startsWith("cus_")) return bad("Invalid customer");
    if (typeof stripe_payment_method_id !== "string" || !stripe_payment_method_id.startsWith("pm_")) return bad("Invalid payment method");
    if (typeof stripe_setup_intent_id !== "string" || !stripe_setup_intent_id.startsWith("seti_")) return bad("Invalid setup intent");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, deposit_amount, platform_fee_percent, currency, business_email, notify_new_booking")
      .eq("user_id", userId)
      .maybeSingle();
    if (!settings) return bad("Business not found");

    const { data: connect } = await admin
      .from("connect_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", userId)
      .eq("environment", env)
      .maybeSingle();
    if (!connect || !connect.charges_enabled) return bad("Business is not accepting payments");

    const deposit = Number(settings.deposit_amount);
    const feePct = Number(settings.platform_fee_percent);

    const { data: pending, error: pErr } = await admin
      .from("pending_bookings")
      .insert({
        user_id: userId,
        stripe_account_id: connect.stripe_account_id,
        client_name,
        client_email,
        service,
        booking_date,
        booking_time,
        duration_minutes: dur,
        notes: notes || null,
        deposit_amount: deposit,
        platform_fee_amount: (deposit * feePct) / 100,
        currency: settings.currency || "GBP",
        payment_environment: env,
        status: "awaiting_owner",
        stripe_customer_id,
        stripe_payment_method_id,
        stripe_setup_intent_id,
      })
      .select()
      .single();
    if (pErr || !pending) throw new Error(pErr?.message || "Failed to save booking request");

    // Notify the owner (fire-and-forget; failure doesn't roll back the request).
    let ownerEmail = settings.business_email || null;
    if (!ownerEmail) {
      try {
        const { data: userInfo } = await admin.auth.admin.getUserById(userId);
        ownerEmail = userInfo?.user?.email || null;
      } catch { /* ignore */ }
    }
    if (ownerEmail && settings.notify_new_booking !== false) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-paid-owner",
            recipientEmail: ownerEmail,
            idempotencyKey: `pending-${pending.id}`,
            templateData: {
              businessName: settings.business_name || "your business",
              clientName: client_name,
              clientEmail: client_email,
              service,
              date: formatDate(booking_date),
              time: formatTime(booking_time),
              confirmationCode: "PENDING",
              depositAmount: `${(settings.currency || "GBP").toUpperCase()} ${deposit.toFixed(2)}`,
            },
          },
        });
      } catch (e) { console.error("owner notify failed", e); }
    }

    return new Response(JSON.stringify({ ok: true, pending_id: pending.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("save-pending-booking error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
