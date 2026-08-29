// Sends "we miss you" rebooking emails to clients who haven't booked in a
// while. Triggered by pg_cron daily. Requires the internal task secret.
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

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const allowed = [Deno.env.get("INTERNAL_TASK_SECRET"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")]
    .filter((v) => !!v) as string[];
  if (!allowed.some((v) => v === token)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lapsed, error } = await admin.rpc("get_lapsed_clients");
    if (error) throw error;

    let sent = 0;
    for (const row of lapsed || []) {
      const bookingUrl = `https://booksuite.online/book/${row.user_id}`;
      try {
        const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "rebooking-reminder",
            recipientEmail: row.client_email,
            idempotencyKey: `rebooking-${row.user_id}-${row.client_email}-${row.last_booking_id}`,
            templateData: {
              businessName: row.business_name || "the business",
              clientName: row.client_name,
              lastService: row.last_service || "your last visit",
              lastDate: formatDate(row.last_booking_date),
              bookingUrl,
            },
          },
        });
        if (sendErr) throw sendErr;
      } catch (e) {
        console.error("rebooking email failed", row.user_id, row.client_email, e);
        continue;
      }

      await admin.from("rebooking_reminders").insert({
        user_id: row.user_id,
        client_email: row.client_email,
        last_booking_id: row.last_booking_id,
      });
      sent++;
    }

    return new Response(JSON.stringify({ ok: true, sent, candidates: (lapsed || []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-rebooking-reminders error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
