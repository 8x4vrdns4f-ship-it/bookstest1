// Sends reminder emails to clients 24 hours before their confirmed appointment.
// Triggered by pg_cron hourly.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
function formatTime(t: string): string { return (t || "").slice(0, 5); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron auth guard: require Bearer <SERVICE_ROLE_KEY> or valid service_role JWT
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

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: bookings, error } = await admin
      .from("bookings")
      .select("*, user_id")
      .eq("status", "confirmed")
      .eq("booking_date", tomorrowStr)
      .is("client_reminder_sent_at", null)
      .limit(200);
    if (error) throw error;

    const ownerIds = Array.from(new Set((bookings || []).map((r: any) => r.user_id)));
    const settingsMap = new Map<string, { business_name: string | null; notify_client_reminder: boolean | null; business_address: string | null }>();
    if (ownerIds.length) {
      const { data: settings } = await admin
        .from("business_settings")
        .select("user_id, business_name, notify_client_reminder, business_address")
        .in("user_id", ownerIds);
      for (const s of settings || []) {
        settingsMap.set(s.user_id, s as any);
      }
    }

    let reminded = 0;
    for (const booking of bookings || []) {
      const settings = settingsMap.get(booking.user_id);
      if (settings?.notify_client_reminder === false) continue;
      if (!booking.client_email) continue;

      const manageUrl = booking.client_access_token
        ? `https://booksuite.online/booking/manage/${booking.client_access_token}`
        : "";

      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-reminder-client",
            recipientEmail: booking.client_email,
            idempotencyKey: `booking-remind-${booking.id}`,
            templateData: {
              businessName: settings?.business_name || "the business",
              clientName: booking.client_name,
              service: booking.service,
              date: formatDate(booking.booking_date),
              time: formatTime(booking.booking_time),
              address: settings?.business_address || "",
              manageUrl,
            },
          },
        });
      } catch (e) {
        console.error("reminder email failed", booking.id, e);
        continue;
      }

      await admin.from("bookings").update({ client_reminder_sent_at: new Date().toISOString() }).eq("id", booking.id);
      reminded++;
    }

    return new Response(JSON.stringify({ ok: true, reminded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-booking-reminders error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
