// PUBLIC endpoint — exchanges a one-time portal link token for a 30-day session token.
import { adminClient, corsHeaders, json, randomToken, sha256 } from "../_shared/portalSession.ts";

const SESSION_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json().catch(() => ({ token: null }));
    if (typeof token !== "string" || token.length < 32) {
      return json({ error: "Invalid link" }, 400);
    }

    const admin = adminClient();
    const tokenHash = await sha256(token);

    const { data: row } = await admin
      .from("client_portal_sessions")
      .select("id, email, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!row) return json({ error: "This link is not valid" }, 404);
    if (row.used_at) return json({ error: "This link has already been used" }, 410);
    if (new Date(row.expires_at) < new Date()) return json({ error: "This link has expired" }, 410);

    const sessionToken = randomToken();
    const sessionHash = await sha256(sessionToken);
    const sessionExpires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();

    const { error: upErr } = await admin
      .from("client_portal_sessions")
      .update({
        used_at: new Date().toISOString(),
        session_token_hash: sessionHash,
        session_expires_at: sessionExpires,
      })
      .eq("id", row.id)
      .is("used_at", null);
    if (upErr) throw upErr;

    return json({
      ok: true,
      session_token: sessionToken,
      email: row.email,
      expires_at: sessionExpires,
    });
  } catch (e) {
    console.error("client-portal-verify error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
