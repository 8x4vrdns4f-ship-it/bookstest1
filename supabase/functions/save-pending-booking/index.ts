// PUBLIC endpoint — called by the widget after stripe.confirmSetup succeeds.
// Persists a pending_bookings row with the saved PaymentMethod and notifies the owner.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveEnv } from "../_shared/stripe.ts";
import { checkRateLimits, getClientIp, rateLimited, RATE_RULES } from "../_shared/rate-limit.ts";

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
      environment,
      stripe_customer_id,
      stripe_payment_method_id,
      stripe_setup_intent_id,
      resource_id,
      party_size,
      payment_option,
      service_id,
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
    if (resource_id != null && (typeof resource_id !== "string" || !uuidRe.test(resource_id))) return bad("Invalid resource");
    if (payment_option != null && payment_option !== "deposit" && payment_option !== "full") return bad("Invalid payment option");
    if (service_id != null && (typeof service_id !== "string" || !uuidRe.test(service_id))) return bad("Invalid service selection");
    const ps = party_size == null ? null : Number(party_size);
    if (ps != null && (!Number.isInteger(ps) || ps < 1 || ps > 999)) return bad("Invalid party size");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, deposit_amount, platform_fee_percent, currency, business_email, notify_new_booking, resources_enabled, assignment_mode, buffer_minutes, services_enabled, payment_mode, timezone")
      .eq("user_id", userId)
      .maybeSingle();
    if (!settings) return bad("Business not found");

    // Reject bookings in the past (evaluated in the business's own timezone)
    try {
      const tz = (settings as any).timezone || "Europe/London";
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).formatToParts(new Date());
      const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
      const nowStamp = `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}`;
      const reqStamp = `${booking_date} ${booking_time.slice(0, 5)}`;
      if (reqStamp < nowStamp) return bad("That time has already passed — please pick another slot");
    } catch (_e) { /* timezone parsing failure should not block bookings */ }


    const { data: connect } = await admin
      .from("connect_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", userId)
      .eq("environment", env)
      .maybeSingle();
    if (!connect || !connect.charges_enabled) return bad("Business is not accepting payments");

    // --- Resource resolution ---
    let finalResourceId: string | null = null;
    if ((settings as any).resources_enabled) {
      const buf = Number((settings as any).buffer_minutes || 0);
      const startMin = ((): number => { const p = booking_time.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); })();
      const endMin = startMin + dur;

      const overlaps = async (resId: string): Promise<boolean> => {
        const { data: rows } = await admin
          .from("bookings")
          .select("booking_time, duration_minutes")
          .eq("user_id", userId)
          .eq("booking_date", booking_date)
          .eq("resource_id", resId)
          .in("status", ["pending", "confirmed"]);
        return (rows || []).some((b: any) => {
          const p = String(b.booking_time).split(":");
          const s = parseInt(p[0]) * 60 + parseInt(p[1]) - buf;
          const e = s + Number(b.duration_minutes || 30) + buf * 2;
          return s < endMin && e > startMin;
        });
      };

      if ((settings as any).assignment_mode === "auto" || !resource_id) {
        // Auto-pick first fitting resource
        const { data: candidates } = await admin
          .from("resources")
          .select("id, capacity")
          .eq("user_id", userId)
          .eq("active", true)
          .gte("capacity", ps || 1)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });
        if (!candidates || candidates.length === 0) return bad("No resources available for that party size");
        for (const c of candidates) {
          if (!(await overlaps(c.id))) { finalResourceId = c.id; break; }
        }
        if (!finalResourceId) return bad("No resources available at that time");
      } else {
        // Client-picked: validate belongs to business, capacity, and no conflict
        const { data: res } = await admin
          .from("resources")
          .select("id, capacity, active, user_id")
          .eq("id", resource_id)
          .maybeSingle();
        if (!res || res.user_id !== userId || !res.active) return bad("Invalid resource selection");
        if ((ps || 1) > Number(res.capacity)) return bad("Resource too small for that party size");
        if (await overlaps(res.id)) return bad("That resource just got booked — please pick another time");
        finalResourceId = res.id;
      }
    }

    const deposit = Number(settings.deposit_amount);
    const feePct = Number(settings.platform_fee_percent);

    // --- Payment option resolution (never trust the browser for amounts) ---
    const paymentMode = String((settings as any).payment_mode || "deposit");
    let servicePrice: number | null = null;
    if ((settings as any).services_enabled && service_id) {
      const { data: svc } = await admin
        .from("services")
        .select("id, user_id, price, active")
        .eq("id", service_id)
        .maybeSingle();
      if (!svc || svc.user_id !== userId || !svc.active) return bad("Invalid service selection");
      servicePrice = svc.price == null ? null : Number(svc.price);
    }

    let finalOption: "deposit" | "full" = "deposit";
    if (servicePrice != null && servicePrice > 0) {
      if (paymentMode === "full") finalOption = "full";
      else if (paymentMode === "client_choice" && payment_option === "full") finalOption = "full";
    }
    const chargeAmount = finalOption === "full" ? Math.max(deposit, servicePrice as number) : deposit;

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
        platform_fee_amount: (chargeAmount * feePct) / 100,
        payment_option: finalOption,
        service_price: servicePrice,
        charge_amount: chargeAmount,
        currency: settings.currency || "GBP",
        payment_environment: env,
        status: "awaiting_owner",
        stripe_customer_id,
        stripe_payment_method_id,
        stripe_setup_intent_id,
        resource_id: finalResourceId,
        party_size: ps,
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
              depositAmount: `${(settings.currency || "GBP").toUpperCase()} ${chargeAmount.toFixed(2)}${finalOption === "full" ? " (full payment)" : ""}`,
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
