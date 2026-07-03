// Sends a single reminder email to business owners when a pending booking
// request is about halfway through its configured TTL and still unanswered.
// Triggered by pg_cron hourly.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEFAULT_TTL_HOURS = 48;

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
function formatTime(t: string): string { return (t || "").slice(0, 5); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows, error } = await admin
      .from("pending_bookings")
      .select("*")
      .eq("status", "awaiting_owner")
      .is("reminder_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;

    const ownerIds = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
    const ttlMap = new Map<string, number>();
    if (ownerIds.length) {
      const { data: settings } = await admin
        .from("business_settings")
        .select("user_id, pending_request_ttl_hours")
        .in("user_id", ownerIds);
      for (const s of settings || []) {
        ttlMap.set(s.user_id, (s as any).pending_request_ttl_hours ?? DEFAULT_TTL_HOURS);
      }
    }

    const now = Date.now();
    const dueRows = (rows || []).filter((r: any) => {
      const ttl = ttlMap.get(r.user_id) ?? DEFAULT_TTL_HOURS;
      return now - new Date(r.created_at).getTime() >= (ttl / 2) * 3600 * 1000;
    }).slice(0, 100);

    let reminded = 0;
    for (const pending of dueRows) {
      const { data: ownerEmailData } = await admin.rpc("get_owner_email", { _user_id: pending.user_id });
      const ownerEmail = ownerEmailData as string | null;
      if (!ownerEmail) {
        console.warn("No owner email for pending booking", pending.id);
        continue;
      }

      const { data: settings } = await admin
        .from("business_settings")
        .select("business_name, currency")
        .eq("user_id", pending.user_id)
        .maybeSingle();

      const ccy = String(settings?.currency || "GBP").toUpperCase();
      const sym = ccy === "USD" ? "$" : ccy === "EUR" ? "€" : ccy === "JPY" ? "¥" : "£";
      const dep = Number(pending.deposit_amount || 0);
      const depositStr = dep > 0 ? `${sym}${dep.toFixed(ccy === "JPY" ? 0 : 2)}` : "";

      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-request-reminder-owner",
            recipientEmail: ownerEmail,
            idempotencyKey: `pending-remind-owner-${pending.id}`,
            templateData: {
              businessName: settings?.business_name || "your business",
              clientName: pending.client_name,
              service: pending.service,
              date: formatDate(pending.booking_date),
              time: formatTime(pending.booking_time),
              deposit: depositStr,
              dashboardUrl: "https://booksuite.online/dashboard",
            },
          },
        });

        await admin
          .from("pending_bookings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", pending.id);
        reminded++;
      } catch (e) {
        console.error("remind email failed", pending.id, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, reminded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("remind-pending-bookings error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
