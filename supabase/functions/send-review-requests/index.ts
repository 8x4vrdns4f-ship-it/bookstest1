// Sends review request emails to clients after their appointment has passed.
// Triggered by pg_cron daily.
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
  const ok = allowed.some((v) => v === token);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date().toISOString();

    // Find confirmed bookings where the appointment has ended, review not yet sent or submitted
    const { data: bookings, error } = await admin
      .from("bookings")
      .select("*, user_id")
      .eq("status", "confirmed")
      .lt("booking_date", now.split("T")[0])
      .is("review_sent_at", null)
      .is("review_submitted_at", null)
      .limit(200);
    if (error) throw error;

    const ownerIds = Array.from(new Set((bookings || []).map((r: any) => r.user_id)));
    const settingsMap = new Map<string, { business_name: string | null; notify_client_review_request: boolean | null }>();
    if (ownerIds.length) {
      const { data: settings } = await admin
        .from("business_settings")
        .select("user_id, business_name, notify_client_review_request")
        .in("user_id", ownerIds);
      for (const s of settings || []) {
        settingsMap.set(s.user_id, s as any);
      }
    }

    let sent = 0;
    for (const booking of bookings || []) {
      if (!booking.client_email || !booking.review_token) continue;

      const settings = settingsMap.get(booking.user_id);
      if (settings?.notify_client_review_request === false) continue;
      const reviewUrl = `https://booksuite.online/review/${booking.review_token}`;

      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "review-request-client",
            recipientEmail: booking.client_email,
            idempotencyKey: `review-request-${booking.id}`,
            templateData: {
              businessName: settings?.business_name || "the business",
              clientName: booking.client_name,
              service: booking.service,
              date: formatDate(booking.booking_date),
              reviewUrl,
            },
          },
        });
      } catch (e) {
        console.error("review request email failed", booking.id, e);
        continue;
      }

      await admin.from("bookings").update({ review_sent_at: new Date().toISOString() }).eq("id", booking.id);
      sent++;
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-review-requests error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
