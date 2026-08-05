// Notifies active waitlist entries when a slot opens up on their preferred date.
// Called from cancel/decline flows (service-role) and manually by owners/staff (user JWT).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIp, RATE_RULES } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, date } = await req.json();
    if (!user_id || !date) {
      return json({ error: "user_id and date required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Authorization ----------------------------------------------------
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return json({ error: "Unauthorized" }, 401);

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const internalSecret = Deno.env.get("INTERNAL_TASK_SECRET") || "";
    const isInternal =
      (serviceKey && token === serviceKey) || (internalSecret && token === internalSecret);

    if (!isInternal) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      const caller = userData?.user;
      if (userErr || !caller) return json({ error: "Unauthorized" }, 401);

      let allowed = caller.id === user_id;
      if (!allowed) {
        const { data: perm } = await admin.rpc("has_company_permission", {
          _auth_uid: caller.id,
          _business_user_id: user_id,
          _perm: "view_all_bookings",
        });
        allowed = perm === true;
      }
      if (!allowed) return json({ error: "Forbidden" }, 403);

      const ok = await checkRateLimit(
        RATE_RULES.waitlist,
        `notify:${caller.id}:${getClientIp(req)}`,
        admin,
      );
      if (!ok) return json({ error: "Too many requests" }, 429);
    }
    // -----------------------------------------------------------------------

    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, waitlist_enabled")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!settings?.waitlist_enabled) {
      return json({ ok: true, notified: 0, reason: "waitlist_disabled" });
    }

    const { data: entries } = await admin
      .from("waitlist_entries")
      .select("id, client_name, client_email, service")
      .eq("user_id", user_id)
      .eq("preferred_date", date)
      .eq("status", "active");

    if (!entries?.length) {
      return json({ ok: true, notified: 0 });
    }

    const bookingUrl = `https://booksuite.online/book/${user_id}`;
    let notified = 0;
    for (const e of entries) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "waitlist-slot-open",
            recipientEmail: e.client_email,
            idempotencyKey: `waitlist-open-${e.id}-${date}`,
            templateData: {
              businessName: settings.business_name || "the business",
              clientName: e.client_name,
              service: e.service,
              date: formatDate(date),
              bookingUrl,
            },
          },
        });
        notified++;
      } catch (err) { console.error("waitlist notify failed", err); }
    }

    await admin
      .from("waitlist_entries")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .eq("user_id", user_id)
      .eq("preferred_date", date)
      .eq("status", "active");

    return json({ ok: true, notified });
  } catch (e) {
    console.error("notify-waitlist error", e);
    return json({ error: "Unable to process request" }, 500);
  }
});
