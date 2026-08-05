// Auto-expires pending booking requests older than 48 hours. Triggered by pg_cron.
// Detaches the saved payment method (no charge), marks the row expired, and
// emails the customer to let them know.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TTL_HOURS = 48;

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
function formatTime(t: string): string { return (t || "").slice(0, 5); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("authorization") || "";
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

    // Fetch candidate pending rows (recent enough that even a 1h TTL might apply)
    // then filter each against its owner's configured TTL.
    const maxLookbackHours = 24 * 8; // covers the 168h max plus buffer
    const lookbackCutoff = new Date(Date.now() - maxLookbackHours * 3600 * 1000).toISOString();

    const { data: candidates, error } = await admin
      .from("pending_bookings")
      .select("*")
      .eq("status", "awaiting_owner")
      .gte("created_at", lookbackCutoff)
      .limit(500);
    if (error) throw error;

    // Also grab anything older than the max window — those are always expired.
    const { data: ancient } = await admin
      .from("pending_bookings")
      .select("*")
      .eq("status", "awaiting_owner")
      .lt("created_at", lookbackCutoff)
      .limit(100);

    const ownerIds = Array.from(new Set((candidates || []).map((r: any) => r.user_id)));
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
    const dueRows = [
      ...(ancient || []),
      ...(candidates || []).filter((r: any) => {
        const ttl = ttlMap.get(r.user_id) ?? DEFAULT_TTL_HOURS;
        return now - new Date(r.created_at).getTime() >= ttl * 3600 * 1000;
      }),
    ].slice(0, 100);

    let expired = 0;
    for (const pending of dueRows) {
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

      // Notify owner
      try {
        const { data: ownerEmailData } = await admin.rpc("get_owner_email", { _user_id: pending.user_id });
        const ownerEmail = ownerEmailData as string | null;
        if (ownerEmail) {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "booking-request-expired-owner",
              recipientEmail: ownerEmail,
              idempotencyKey: `pending-expired-owner-${pending.id}`,
              templateData: {
                businessName: settings?.business_name || "the business",
                clientName: pending.client_name,
                service: pending.service,
                date: formatDate(pending.booking_date),
                time: formatTime(pending.booking_time),
              },
            },
          });
        }
      } catch (e) { console.error("expire owner email failed", e); }
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
