// PUBLIC endpoint (session-token protected) — customer updates their own name/phone.
import { adminClient, corsHeaders, json, resolveSession } from "../_shared/portalSession.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_token, name, phone } = await req.json().catch(() => ({}));
    const admin = adminClient();
    const email = await resolveSession(admin, session_token);
    if (!email) return json({ error: "Session expired", code: "no_session" }, 401);

    const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : "";
    const cleanPhone = typeof phone === "string" ? phone.trim().slice(0, 40) : "";
    if (!cleanName) return json({ error: "Enter your name" }, 400);

    const updates: Record<string, unknown> = {
      name: cleanName,
      phone: cleanPhone || null,
      updated_at: new Date().toISOString(),
    };

    await admin.from("clients").update(updates).ilike("email", email);

    // Keep future bookings showing the new name.
    const today = new Date().toISOString().slice(0, 10);
    await admin
      .from("bookings")
      .update({ client_name: cleanName, updated_at: new Date().toISOString() })
      .ilike("client_email", email)
      .gte("booking_date", today);

    return json({ ok: true });
  } catch (e) {
    console.error("client-portal-update-client error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
