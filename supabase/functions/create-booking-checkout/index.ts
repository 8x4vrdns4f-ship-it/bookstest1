// PUBLIC endpoint — called by the embed widget. No JWT required.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv, sanitizeOrigin } from "../_shared/stripe.ts";
import { checkRateLimits, getClientIp, rateLimited, RATE_RULES } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    const rlOk = await checkRateLimits([
      { rule: RATE_RULES.booking, identifier: `ip:${getClientIp(req)}` },
      { rule: RATE_RULES.booking, identifier: `email:${body.client_email ?? ""}` },
    ]);
    if (!rlOk) return rateLimited(corsHeaders, 900);
    const {
      userId,
      service,
      booking_date,
      booking_time,
      duration_minutes,
      client_name,
      client_email,
      notes,
      origin,
      environment,
    } = body;

    const env = resolveEnv(environment);

    if (!userId || !service || !booking_date || !booking_time || !client_name || !client_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side validation
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const timeRe = /^\d{2}:\d{2}(:\d{2})?$/;
    const bad = (msg: string) =>
      new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (typeof userId !== "string" || !uuidRe.test(userId)) return bad("Invalid business id");
    if (typeof client_email !== "string" || client_email.length > 254 || !emailRe.test(client_email))
      return bad("Invalid email");
    if (typeof client_name !== "string" || client_name.trim().length === 0 || client_name.length > 200)
      return bad("Invalid name");
    if (typeof service !== "string" || service.trim().length === 0 || service.length > 200)
      return bad("Invalid service");
    if (typeof booking_date !== "string" || !dateRe.test(booking_date)) return bad("Invalid date");
    const bd = new Date(`${booking_date}T00:00:00Z`);
    if (isNaN(bd.getTime())) return bad("Invalid date");
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    if (bd < todayUtc) return bad("Booking date must be today or later");
    if (typeof booking_time !== "string" || !timeRe.test(booking_time)) return bad("Invalid time");
    const dur = Number(duration_minutes ?? 60);
    if (!Number.isInteger(dur) || dur < 15 || dur > 480) return bad("Invalid duration");
    if (notes != null && (typeof notes !== "string" || notes.length > 2000))
      return bad("Notes too long");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings, error: sErr } = await admin
      .from("business_settings")
      .select("business_name, deposit_amount, platform_fee_percent, currency, require_deposit")
      .eq("user_id", userId)
      .maybeSingle();
    if (sErr || !settings) throw new Error("Business not found");

    const { data: connect } = await admin
      .from("connect_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", userId)
      .eq("environment", env)
      .maybeSingle();

    if (!connect || !connect.charges_enabled) {
      return new Response(
        JSON.stringify({ error: "This business hasn't enabled online payments yet." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deposit = Number(settings.deposit_amount);
    const feePct = Number(settings.platform_fee_percent);
    const currency = (settings.currency || "GBP").toLowerCase();
    const depositMinor = Math.round(deposit * 100);
    const feeMinor = Math.round((deposit * feePct) / 100 * 100);

    // Reserve pending booking row
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
      })
      .select()
      .single();
    if (pErr || !pending) throw new Error(pErr?.message || "Failed to reserve booking");

    const stripe = createStripeClient(env);
    const baseOrigin = sanitizeOrigin(origin || req.headers.get("origin"), "https://booksuite.online");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: client_email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Deposit — ${settings.business_name || "Booking"}`,
              description: `${service} on ${booking_date} at ${booking_time}`,
            },
            unit_amount: depositMinor,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeMinor,
        transfer_data: { destination: connect.stripe_account_id },
        metadata: { pending_booking_id: pending.id, user_id: userId },
      },
      metadata: { pending_booking_id: pending.id, user_id: userId },
      success_url: `${baseOrigin}/book/${userId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseOrigin}/book/${userId}/cancelled`,
    });

    await admin
      .from("pending_bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", pending.id);

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-booking-checkout error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
