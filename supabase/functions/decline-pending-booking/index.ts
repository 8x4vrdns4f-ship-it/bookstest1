// OWNER-AUTHED — declines a booking request. Detaches the saved payment method
// (no charge occurs) and emails the customer.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";

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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: uErr } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !userData?.user) throw new Error("Unauthorized");

    const { pending_id, reason } = await req.json();
    if (!pending_id || typeof pending_id !== "string") throw new Error("Missing pending_id");
    const declineReason = typeof reason === "string" ? reason.slice(0, 500) : "Declined by business";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pending } = await admin
      .from("pending_bookings")
      .select("*")
      .eq("id", pending_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!pending) throw new Error("Booking request not found");

    // Detach the PaymentMethod so it can't be re-used on this customer.
    if (pending.stripe_payment_method_id) {
      try {
        const env = resolveEnv((pending as any).payment_environment);
        const stripe = createStripeClient(env);
        await stripe.paymentMethods.detach(pending.stripe_payment_method_id);
      } catch (e) {
        console.warn("PM detach failed (non-fatal)", e);
      }
    }

    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name")
      .eq("user_id", pending.user_id)
      .maybeSingle();

    // Email the customer
    if (pending.client_email) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-declined",
            recipientEmail: pending.client_email,
            idempotencyKey: `pending-declined-${pending.id}`,
            templateData: {
              businessName: settings?.business_name || "the business",
              clientName: pending.client_name,
              service: pending.service,
              date: formatDate(pending.booking_date),
              time: formatTime(pending.booking_time),
              reason: declineReason,
            },
          },
        });
      } catch (e) { console.error("decline email failed", e); }
    }

    // Notify waitlist for that date (non-fatal).
    try {
      await admin.functions.invoke("notify-waitlist", {
        body: { user_id: pending.user_id, date: pending.booking_date },
      });
    } catch (e) { console.error("waitlist notify failed", e); }

    await admin.from("pending_bookings").delete().eq("id", pending.id);


    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("decline-pending-booking error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
