// PUBLIC endpoint (session-token protected) — availability for rescheduling a booking.
import { adminClient, corsHeaders, json, resolveSession } from "../_shared/portalSession.ts";
import {
  availableSlots, bookableDateRange, dayHours, fmtDate, loadAvailability,
} from "../_shared/portalSlots.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_token, booking_id, date } = await req.json().catch(() => ({}));
    const admin = adminClient();
    const email = await resolveSession(admin, session_token);
    if (!email) return json({ error: "Session expired", code: "no_session" }, 401);
    if (typeof booking_id !== "string") return json({ error: "Missing booking" }, 400);

    const { data: booking } = await admin
      .from("bookings")
      .select("id, user_id, client_email, booking_date, booking_time, duration_minutes, status")
      .eq("id", booking_id)
      .maybeSingle();
    if (!booking || (booking.client_email || "").toLowerCase() !== email) {
      return json({ error: "Booking not found" }, 404);
    }

    const { data: ws } = await admin.rpc("get_widget_settings", { p_user_id: booking.user_id });
    const settings = (ws as any[])?.[0] ?? {};
    const range = bookableDateRange(settings);
    const ctx = await loadAvailability(admin, booking.user_id, range.from, range.to);

    // Which days are open at all (for the date picker)?
    const openDays: string[] = [];
    const cursor = new Date(`${range.from}T00:00:00`);
    const last = new Date(`${range.to}T00:00:00`);
    while (cursor <= last) {
      const ds = fmtDate(cursor);
      if (!dayHours(ctx, ds).closed) openDays.push(ds);
      cursor.setDate(cursor.getDate() + 1);
    }

    let slots: string[] = [];
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      slots = availableSlots(ctx, date, booking.duration_minutes || 30, {
        date: booking.booking_date,
        time: booking.booking_time,
      });
    }

    return json({ ok: true, open_days: openDays, slots, range });
  } catch (e) {
    console.error("client-portal-slots error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
