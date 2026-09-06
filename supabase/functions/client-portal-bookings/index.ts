// PUBLIC endpoint (session-token protected) — lists every booking made with the verified email.
import { adminClient, corsHeaders, json, resolveSession } from "../_shared/portalSession.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_token } = await req.json().catch(() => ({}));
    const admin = adminClient();
    const email = await resolveSession(admin, session_token);
    if (!email) return json({ error: "Session expired", code: "no_session" }, 401);

    const { data: bookings, error } = await admin
      .from("bookings")
      .select(
        "id, user_id, service, booking_date, booking_time, end_date, rental_days, duration_minutes, party_size, " +
        "client_name, status, notes, deposit_amount, charge_amount, service_price, payment_status, " +
        "confirmation_code, review_token, review_submitted_at, created_at",
      )
      .ilike("client_email", email)
      .order("booking_date", { ascending: false })
      .limit(300);
    if (error) throw error;

    const rows = bookings ?? [];
    const userIds = [...new Set(rows.map((b) => b.user_id))];

    let businesses: Record<string, any> = {};
    if (userIds.length) {
      const { data: settings } = await admin
        .from("business_settings")
        .select(
          "user_id, business_name, business_address, business_phone, business_email, " +
          "cancellation_hours, currency, accent_color, booking_mode",
        )
        .in("user_id", userIds);
      for (const s of settings ?? []) businesses[s.user_id] = s;
    }

    const clientName = rows.find((b) => b.client_name)?.client_name ?? null;
    let phone: string | null = null;
    const { data: clientRows } = await admin
      .from("clients")
      .select("phone")
      .ilike("email", email)
      .limit(1);
    if (clientRows?.length) phone = clientRows[0].phone;

    return json({
      ok: true,
      email,
      profile: { name: clientName, phone },
      bookings: rows.map((b) => ({
        ...b,
        business: businesses[b.user_id] ?? { business_name: "Business" },
      })),
    });
  } catch (e) {
    console.error("client-portal-bookings error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
