// PUBLIC endpoint — lets a client submit a review for their booking via the review token.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimits, getClientIp, rateLimited, RATE_RULES } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    const rlOk = await checkRateLimits([
      { rule: RATE_RULES.review, identifier: `ip:${getClientIp(req)}` },
    ]);
    if (!rlOk) return rateLimited(corsHeaders, 3600);
    const { token, rating, comment } = body;

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return new Response(JSON.stringify({ error: "Rating must be 1–5" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (comment != null && (typeof comment !== "string" || comment.length > 2000)) {
      return new Response(JSON.stringify({ error: "Comment too long" }), {
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
      .eq("review_token", token)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.review_submitted_at) {
      return new Response(JSON.stringify({ error: "Review already submitted" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent reviews on cancelled / pending bookings
    if (!["confirmed", "completed", "in_progress", "no_show"].includes(booking.status)) {
      return new Response(JSON.stringify({ error: "Cannot review this booking" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("reviews").insert({
      booking_id: booking.id,
      user_id: booking.user_id,
      rating: ratingNum,
      comment: comment?.trim() || null,
    });

    await admin.from("bookings").update({
      review_submitted_at: new Date().toISOString(),
    }).eq("id", booking.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-review error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
