// PUBLIC endpoint — called by the embed widget. Creates a Stripe Customer +
// SetupIntent so the customer can save their card without being charged.
// The actual deposit is only charged when the business accepts the request.
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";
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
      { rule: RATE_RULES.booking, identifier: `ip:${getClientIp(req)}` },
      { rule: RATE_RULES.booking, identifier: `email:${body.client_email ?? ""}` },
    ]);
    if (!rlOk) return rateLimited(corsHeaders, 900);
    const { userId, client_email, environment } = body;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (typeof userId !== "string" || !uuidRe.test(userId)) {
      return new Response(JSON.stringify({ error: "Invalid business id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof client_email !== "string" || client_email.length > 254 || !emailRe.test(client_email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = resolveEnv(environment);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: connect } = await admin
      .from("connect_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", userId)
      .eq("environment", env)
      .maybeSingle();

    if (!connect || !connect.charges_enabled) {
      return new Response(
        JSON.stringify({ error: "This business hasn't enabled online payments yet." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = createStripeClient(env);

    // Reuse a platform-account customer for this email if we've seen them before.
    let customerId: string | undefined;
    const existing = await stripe.customers.list({ email: client_email, limit: 1 });
    if (existing.data.length) customerId = existing.data[0].id;
    if (!customerId) {
      const created = await stripe.customers.create({
        email: client_email,
        metadata: { source: "booksuite_widget", business_user_id: userId },
      });
      customerId = created.id;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      on_behalf_of: connect.stripe_account_id,
      metadata: { business_user_id: userId },
    });

    return new Response(
      JSON.stringify({
        client_secret: setupIntent.client_secret,
        customer_id: customerId,
        setup_intent_id: setupIntent.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("create-booking-intent error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
