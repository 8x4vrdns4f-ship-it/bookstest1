// Notifies active waitlist entries when a slot opens up on their preferred date.
// Called from cancel/decline flows and manually by owners.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, date } = await req.json();
    if (!user_id || !date) {
      return new Response(JSON.stringify({ error: "user_id and date required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, waitlist_enabled")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!settings?.waitlist_enabled) {
      return new Response(JSON.stringify({ ok: true, notified: 0, reason: "waitlist_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: entries } = await admin
      .from("waitlist_entries")
      .select("id, client_name, client_email, service")
      .eq("user_id", user_id)
      .eq("preferred_date", date)
      .eq("status", "active");

    if (!entries?.length) {
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    return new Response(JSON.stringify({ ok: true, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-waitlist error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
