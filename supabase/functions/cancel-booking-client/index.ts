// PUBLIC endpoint — lets a client cancel their own booking via the self-service token.
// `preview: true` returns what would be refunded/kept without cancelling.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { CLIENT_CLOSED, loadCancelSettings, performClientCancel, quoteFor } from "../_shared/client-cancel.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, preview } = await req.json();
    if (!token || typeof token !== "string") return json({ error: "Missing token" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: booking, error: bErr } = await admin
      .from("bookings").select("*").eq("client_access_token", token).maybeSingle();
    if (bErr) throw bErr;
    if (!booking) return json({ error: "Booking not found" }, 404);
    if (booking.client_token_expires_at && new Date(booking.client_token_expires_at) < new Date()) {
      return json({ error: "Link expired" }, 410);
    }
    if (CLIENT_CLOSED.includes(booking.status)) {
      return json({ error: `Booking is already ${booking.status.replace(/_/g, " ")}` }, 409);
    }

    if (preview) {
      const q = quoteFor(booking, await loadCancelSettings(admin, booking.user_id));
      return json({ ok: true, preview: true, late: q.late, cancellation_hours: q.cancellationHours, charged: q.charged, refund: q.refund, kept: q.kept, currency: q.currency });
    }

    const r = await performClientCancel(admin, booking, "manage link");
    if ("conflict" in r) return json({ error: "Already being processed", code: "already_processing" }, 409);
    return json(r);
  } catch (e) {
    console.error("cancel-booking-client error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
