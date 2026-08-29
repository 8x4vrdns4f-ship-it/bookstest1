// Sends an owner-composed campaign email to the business's past clients.
// Authenticated: only the business owner can send their own campaigns.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_AUDIENCE = 2000;

function makeToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const campaignId = body?.campaign_id;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof campaignId !== "string" || !uuidRe.test(campaignId)) {
      return json({ error: "Invalid campaign id" }, 400);
    }

    // Ownership + tier checks
    const { data: campaign } = await admin
      .from("campaigns")
      .select("id, user_id, subject, body, status")
      .eq("id", campaignId)
      .maybeSingle();
    if (!campaign || campaign.user_id !== user.id) return json({ error: "Campaign not found" }, 404);
    if (campaign.status !== "draft") return json({ error: "This campaign has already been sent" }, 400);

    const { data: allowed } = await admin.rpc("user_tier_allows", {
      _user_id: user.id, _feature: "campaigns",
    });
    if (!allowed) {
      return json({ error: "Campaigns are available on Gold and Platinum plans" }, 403);
    }

    const { data: rlOk } = await admin.rpc("check_rate_limit", {
      p_bucket: "campaign", p_identifier: `user:${user.id}`, p_max_hits: 5, p_window_seconds: 86400,
    });
    if (rlOk === false) {
      return json({ error: "Daily campaign limit reached — try again tomorrow" }, 429);
    }

    // Build the audience: clients list + booking emails, deduplicated.
    const [clientsRes, bookingsRes, suppressedRes, bizRes] = await Promise.all([
      admin.from("clients").select("name, email").eq("user_id", user.id).not("email", "is", null),
      admin.from("bookings").select("client_name, client_email").eq("user_id", user.id).not("client_email", "is", null),
      admin.from("suppressed_emails").select("email"),
      admin.from("business_settings").select("business_name").eq("user_id", user.id).maybeSingle(),
    ]);

    const suppressed = new Set((suppressedRes.data || []).map((r: any) => String(r.email).toLowerCase()));
    const audience = new Map<string, string>(); // email -> name
    for (const c of clientsRes.data || []) {
      const email = String(c.email || "").trim().toLowerCase();
      if (email && !suppressed.has(email)) audience.set(email, c.name || "");
    }
    for (const b of bookingsRes.data || []) {
      const email = String(b.client_email || "").trim().toLowerCase();
      if (email && !suppressed.has(email) && !audience.has(email)) {
        audience.set(email, b.client_name || "");
      }
    }

    const recipients = Array.from(audience.entries()).slice(0, MAX_AUDIENCE);
    if (recipients.length === 0) {
      return json({ error: "No clients to send to yet — you'll have an audience after your first bookings" }, 400);
    }

    await admin.from("campaigns").update({ status: "sending", audience_count: recipients.length }).eq("id", campaignId);

    const businessName = bizRes.data?.business_name || "your business";
    const bookingUrl = `https://booksuite.online/book/${user.id}`;

    let sentCount = 0;
    for (const [email, name] of recipients) {
      try {
        // One unsubscribe token per email address
        let unsubToken: string;
        const { data: existing } = await admin
          .from("email_unsubscribe_tokens")
          .select("token")
          .eq("email", email)
          .maybeSingle();
        if (existing?.token) {
          unsubToken = existing.token;
        } else {
          unsubToken = makeToken();
          await admin.from("email_unsubscribe_tokens").insert({ token: unsubToken, email });
        }
        const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${unsubToken}`;

        const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "campaign-email",
            recipientEmail: email,
            idempotencyKey: `campaign-${campaignId}-${email}`,
            templateData: {
              businessName,
              clientName: name,
              subject: campaign.subject,
              messageBody: campaign.body,
              bookingUrl,
              unsubscribeUrl,
            },
          },
        });
        if (sendErr) throw sendErr;
        sentCount++;
      } catch (e) {
        console.error("campaign send failed", campaignId, email, e);
      }
    }

    await admin.from("campaigns").update({
      status: "sent",
      sent_count: sentCount,
      sent_at: new Date().toISOString(),
    }).eq("id", campaignId);

    return json({ ok: true, sent: sentCount, audience: recipients.length });
  } catch (e) {
    console.error("send-campaign error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
