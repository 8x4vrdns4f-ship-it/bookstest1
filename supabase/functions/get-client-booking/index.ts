// PUBLIC endpoint — looks up a booking by its client access token.
// Returns booking details and business info for the self-service portal.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("*")
      .eq("client_access_token", token)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token expiry check
    if (booking.client_token_expires_at && new Date(booking.client_token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link expired" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await admin
      .from("business_settings")
      .select("business_name, business_address, business_phone, cancellation_hours, currency")
      .eq("user_id", booking.user_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      ok: true,
      booking: {
        id: booking.id,
        service: booking.service,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        duration_minutes: booking.duration_minutes,
        client_name: booking.client_name,
        status: booking.status,
        deposit_amount: booking.deposit_amount,
        payment_status: booking.payment_status,
        confirmation_code: booking.confirmation_code,
      },
      business: settings || {},
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-client-booking error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
