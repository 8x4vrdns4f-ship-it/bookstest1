// The ONLY way staff cancel or decline a booking. Owner (or staff with
// approve_requests / manage_settings) only. Paid bookings are refunded in full.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { fmtDate, fmtTime, lockForRefund, OPEN_STATUSES, refundBooking, refundNote } from "../_shared/booking-refund.ts";
import { chargedAmount, hasRefundablePayment } from "../_shared/refund-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const CLOSED = ["cancelled", "cancelled_by_client", "declined", "completed", "no_show"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userDb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: cErr } = await userDb.auth.getClaims(authHeader.slice(7));
    const uid = claims?.claims?.sub as string | undefined;
    if (cErr || !uid) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { booking_id, reason, mode } = body as { booking_id?: unknown; reason?: unknown; mode?: unknown };
    if (typeof booking_id !== "string" || !/^[0-9a-f-]{36}$/i.test(booking_id)) return json({ error: "Missing booking" }, 400);
    const isDecline = mode === "decline";
    const cleanReason = typeof reason === "string" && reason.trim()
      ? reason.trim().slice(0, 300)
      : isDecline ? "Declined by business" : "Cancelled by business";

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: booking } = await admin.from("bookings").select("*").eq("id", booking_id).maybeSingle();
    if (!booking) return json({ error: "Booking not found" }, 404);

    let allowed = booking.user_id === uid;
    if (!allowed) {
      for (const perm of ["approve_requests", "manage_settings"]) {
        const { data } = await userDb.rpc("has_company_permission", { _auth_uid: uid, _business_user_id: booking.user_id, _perm: perm });
        if (data === true) { allowed = true; break; }
      }
    }
    if (!allowed) return json({ error: "You don't have permission to cancel this booking" }, 403);
    if (CLOSED.includes(booking.status)) return json({ error: `This booking is already ${booking.status.replace(/_/g, " ")}` }, 409);

    const { data: settings } = await admin.from("business_settings")
      .select("business_name, currency").eq("user_id", booking.user_id).maybeSingle();
    const currency = (settings?.currency || "GBP").toUpperCase();
    const businessName = settings?.business_name || "the business";

    const paid = hasRefundablePayment(booking);
    if (body.preview) return json({ ok: true, preview: true, paid, refund: paid ? chargedAmount(booking) : 0, currency });

    let refunded = 0;
    let failed = false;
    let refundError: string | null = null;
    const busy = () => json({ error: "Already being processed", code: "already_processing" }, 409);
    if (paid) {
      // Atomic claim — a second click / retry / parallel client cancel gets 409.
      if (!(await lockForRefund(admin, booking, { requireOpen: true }))) return busy();
      const r = await refundBooking(admin, booking, { context: isDecline ? "owner decline" : "owner cancel", businessName, currency });
      refunded = r.amount;
      if (!r.ok) { failed = true; refundError = r.error; }
    }

    let upd = admin.from("bookings").update({
      status: "cancelled", decline_reason: cleanReason, updated_at: new Date().toISOString(),
    }).eq("id", booking.id);
    // Unpaid: the status change itself is the atomic claim.
    if (!paid) upd = upd.in("status", OPEN_STATUSES).eq("payment_status", booking.payment_status);
    const { data: done, error: uErr } = await upd.select("id");
    if (uErr) return json({ error: uErr.message }, 500);
    if (!done?.length) return busy();

    if (booking.client_email) {
      const base = {
        businessName, clientName: booking.client_name, service: booking.service,
        date: fmtDate(booking.booking_date), time: fmtTime(booking.booking_time), reason: cleanReason,
      };
      const usePlainDecline = isDecline && !paid;
      try {
        await admin.functions.invoke("app-email", {
          body: {
            templateName: usePlainDecline ? "booking-declined" : "booking-cancelled-client",
            businessUserId: booking.user_id,
            recipientEmail: booking.client_email,
            idempotencyKey: usePlainDecline ? `booking-decline-${booking.id}` : `booking-cancel-${booking.id}`,
            templateData: usePlainDecline ? base : { ...base, refundNote: refundNote({ refunded, kept: 0, failed, currency, paid }) },
          },
        });
      } catch (e) { console.error("client cancel email failed", e); }
    }

    try {
      await admin.functions.invoke("notify-waitlist", { body: { user_id: booking.user_id, date: booking.booking_date } });
    } catch (e) { console.error("waitlist notify failed", e); }

    return json({ ok: true, refunded: failed ? 0 : refunded, refund_failed: failed, refund_error: refundError, currency });
  } catch (e) {
    console.error("cancel-booking-owner error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
