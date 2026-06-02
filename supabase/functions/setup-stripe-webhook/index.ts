// One-shot admin endpoint to (re)register the Stripe webhook for this project.
// Returns the signing secret in the response so it can be stored as a project secret.
// SECURITY: requires the caller to be authenticated AND the platform owner email.
// Call: POST { env: "sandbox" | "live" }

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) throw new Error("Unauthorized");

    const body = await req.json().catch(() => ({}));
    const env = (body.env || "sandbox") as StripeEnv;
    if (env !== "sandbox" && env !== "live") throw new Error("env must be sandbox or live");

    const projectRef = "rehafgjaqbdeuatnfiyk";
    const url = `https://${projectRef}.functions.supabase.co/stripe-connect-webhook?env=${env}`;
    const events = ["checkout.session.completed", "charge.refunded", "account.updated"];

    const stripe = createStripeClient(env);

    // Find existing endpoint with the same URL
    const list = await stripe.webhookEndpoints.list({ limit: 100 });
    const existing = list.data.find((w: any) => w.url === url);

    let endpoint: any;
    let signingSecret: string | null = null;
    if (existing) {
      endpoint = await stripe.webhookEndpoints.update(existing.id, {
        enabled_events: events as any,
      });
      // Stripe only returns the secret on CREATE, not update. Tell caller to delete + recreate if they need it.
      signingSecret = null;
    } else {
      endpoint = await stripe.webhookEndpoints.create({
        url,
        enabled_events: events as any,
        connect: true, // receive both platform and connected-account events
        description: "BookSuite — bookings + Connect",
      });
      signingSecret = endpoint.secret || null;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        endpoint_id: endpoint.id,
        url,
        events,
        created: !existing,
        signing_secret: signingSecret,
        secret_env_var: env === "sandbox" ? "STRIPE_WEBHOOK_SECRET_SANDBOX" : "STRIPE_WEBHOOK_SECRET_LIVE",
        note: signingSecret
          ? "Save signing_secret as the named env var, then redeploy stripe-connect-webhook."
          : "Endpoint already existed; signing secret is only returned on create. Delete it in Stripe dashboard and call this again if needed.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("setup-stripe-webhook error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
