import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";
import { resolveSenderIdentity } from "../_shared/sender-identity.ts";
import {
  checkRateLimits,
  getClientIp,
  rateLimited,
  RATE_RULES,
} from "../_shared/rate-limit.ts";

// Sends the "you're on the waitlist" confirmation from the server.
// The widget cannot call app-email directly: a visitor joining a waitlist is
// not signed in, and app-email only accepts authenticated callers.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const admin = createClient(supabaseUrl, serviceKey);

  let userId = "";
  let email = "";
  let preferredDate = "";
  try {
    const body = await req.json();
    userId = String(body.user_id ?? body.userId ?? "");
    email = String(body.client_email ?? body.email ?? "").trim().toLowerCase();
    preferredDate = String(body.preferred_date ?? body.date ?? "");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!UUID_RE.test(userId) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !DATE_RE.test(preferredDate)) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const allowed = await checkRateLimits(
    [
      { rule: RATE_RULES.waitlist, identifier: getClientIp(req) },
      { rule: RATE_RULES.waitlist, identifier: email },
    ],
    admin
  );
  if (!allowed) return rateLimited(corsHeaders, 60);

  // Confirm the waitlist entry really exists before mailing anyone. This keeps
  // the endpoint from becoming a free email trigger for arbitrary addresses.
  const { data: entry } = await admin
    .from("waitlist_entries")
    .select("id, client_name, client_email, service, preferred_date, preferred_time_start, preferred_time_end")
    .eq("user_id", userId)
    .eq("preferred_date", preferredDate)
    .ilike("client_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!entry) {
    return new Response(JSON.stringify({ sent: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sender = await resolveSenderIdentity(admin, userId);
  const { data: settings } = await admin
    .from("business_settings")
    .select("business_name")
    .eq("user_id", userId)
    .maybeSingle();

  const timeWindow =
    entry.preferred_time_start && entry.preferred_time_end
      ? `${entry.preferred_time_start.slice(0, 5)}–${entry.preferred_time_end.slice(0, 5)}`
      : (entry.preferred_time_start || entry.preferred_time_end || "").slice(0, 5) || undefined;

  try {
    const result = await sendTemplateEmail("waitlist-added", entry.client_email, {
      templateData: {
        businessName: settings?.business_name || "the business",
        clientName: entry.client_name,
        service: entry.service || undefined,
        date: new Date(entry.preferred_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        timeWindow,
      },
      idempotencyKey: `waitlist-added-${entry.id}`,
      fromName: sender.fromName,
      fromAddress: sender.fromAddress,
      replyTo: sender.replyTo,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("waitlist confirmation failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return new Response(JSON.stringify({ sent: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
