// PUBLIC endpoint — emails a one-time sign-in link for the customer bookings portal.
// Always returns ok:true so the form cannot be used to discover which emails exist.
import {
  adminClient, corsHeaders, json, normalizeEmail, randomToken, sha256,
} from "../_shared/portalSession.ts";

const LINK_TTL_MINUTES = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const origin = typeof body?.origin === "string" && body.origin.startsWith("http")
      ? body.origin.replace(/\/$/, "")
      : "https://booksuite.online";

    if (!email) return json({ error: "Enter a valid email address" }, 400);

    const admin = adminClient();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const [{ data: emailOk }, { data: ipOk }] = await Promise.all([
      admin.rpc("check_rate_limit", {
        p_bucket: "client_portal_link", p_identifier: email, p_max_hits: 5, p_window_seconds: 3600,
      }),
      admin.rpc("check_rate_limit", {
        p_bucket: "client_portal_link_ip", p_identifier: ip, p_max_hits: 20, p_window_seconds: 3600,
      }),
    ]);
    if (emailOk === false || ipOk === false) {
      return json({ ok: true, throttled: true });
    }

    // Does this email actually have bookings? If not, silently do nothing.
    const { data: existing } = await admin
      .from("bookings")
      .select("id")
      .ilike("client_email", email)
      .limit(1);

    if (!existing || existing.length === 0) return json({ ok: true });

    const token = randomToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + LINK_TTL_MINUTES * 60_000).toISOString();

    const { error: insErr } = await admin.from("client_portal_sessions").insert({
      email, token_hash: tokenHash, expires_at: expiresAt, ip,
    });
    if (insErr) throw insErr;

    const link = `${origin}/my-bookings/verify?token=${token}`;

    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "client-portal-link",
          recipientEmail: email,
          idempotencyKey: `portal-link-${tokenHash.slice(0, 24)}`,
          templateData: { link, minutes: LINK_TTL_MINUTES },
        },
      });
    } catch (e) {
      console.error("portal link email failed", e);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("client-portal-request-link error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
