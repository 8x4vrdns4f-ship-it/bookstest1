// Auto-expires pending booking requests older than 48 hours. Triggered by pg_cron.
// Detaches the saved payment method (no charge), marks the row expired, and
// emails the customer to let them know.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TTL_HOURS = 48;

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
function formatTime(t: string): string { return (t || "").slice(0, 5); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - TTL_HOURS * 3600 * 1000).toISOString();

    const { data: rows, error } = await admin
      .from("pending_bookings")
      .select("*")
      .eq("status", "awaiting_owner")
      .lt("created_at", cutoff)
      .limit(100);
    if (error) throw error;

    let expired = 0;
    for (const pending of rows || []) {
      // Detach the saved PaymentMethod (best-effort).
      if (pending.stripe_payment_method_id) {
        try {
          const env = resolveEnv((pending as any).payment_environment);
          const stripe = createStripeClient(env);
          await stripe.paymentMethods.detach(pending.stripe_payment_method_id);
        } catch (e) {
          console.warn("PM detach failed (non-fatal)", pending.id, e);
        }
      }

      // Atomic transition — skip if already accepted/declined in a race.
      const { data: updated } = await admin
        .from("pending_bookings")
        .update({ status: "expired", expired_at: new Date().toISOString() })
        .eq("id", pending.id)
        .eq("status", "awaiting_owner")
        .select("id")
        .maybeSingle();
      if (!updated) continue;
      expired++;

      const { data: settings } = await admin
        .from("business_settings")
        .select("business_name")
        .eq("user_id", pending.user_id)
        .maybeSingle();

      if (pending.client_email) {
        try {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "booking-request-expired",
              recipientEmail: pending.client_email,
              idempotencyKey: `pending-expired-${pending.id}`,
              templateData: {
                businessName: settings?.business_name || "the business",
                clientName: pending.client_name,
                service: pending.service,
                date: formatDate(pending.booking_date),
                time: formatTime(pending.booking_time),
              },
            },
          });
        } catch (e) { console.error("expire email failed", e); }
      }
    }

    return new Response(JSON.stringify({ ok: true, expired }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("expire-pending-bookings error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
