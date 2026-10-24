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

    // Platform owner allowlist. Only these emails may (re)register the platform's Stripe webhook.
    const PLATFORM_OWNER_EMAILS = (Deno.env.get("PLATFORM_OWNER_EMAILS") ?? "help@booksuite.online")
      .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const callerEmail = (userData.user.email ?? "").toLowerCase();
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin && (!callerEmail || !PLATFORM_OWNER_EMAILS.includes(callerEmail))) {
      return new Response(JSON.stringify({ error: "Forbidden: platform owner only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const env = (body.env || "sandbox") as StripeEnv;
    if (env !== "sandbox" && env !== "live") throw new Error("env must be sandbox or live");

    const projectRef = "rehafgjaqbdeuatnfiyk";
    const events = [
      "checkout.session.completed", "charge.refunded", "account.updated", "invoice.paid",
      "charge.dispute.created", "charge.dispute.closed", "charge.dispute.funds_withdrawn", "charge.dispute.funds_reinstated",
    ];
    const stripe = createStripeClient(env);
    const list = await stripe.webhookEndpoints.list({ limit: 100 });

    // Destination charges, refunds, disputes and subscription invoices are
    // events on BookSuite's own (platform) account; account.updated comes from
    // connected accounts. Stripe needs a separate endpoint for each.
    const results: any[] = [];
    for (const scope of ["connect", "platform"] as const) {
      const url = `https://${projectRef}.functions.supabase.co/stripe-connect-webhook?env=${env}${scope === "platform" ? "&scope=platform" : ""}`;
      const existing = list.data.find((w: any) => w.url === url);
      let endpoint: any;
      let signingSecret: string | null = null;
      if (existing) {
        endpoint = await stripe.webhookEndpoints.update(existing.id, { enabled_events: events as any });
      } else {
        endpoint = await stripe.webhookEndpoints.create({
          url,
          enabled_events: events as any,
          ...(scope === "connect" ? { connect: true } : {}),
          description: scope === "connect" ? "BookSuite — Connect accounts" : "BookSuite — platform payments, disputes, invoices",
        });
        signingSecret = endpoint.secret || null;
      }
      const base = env === "sandbox" ? "STRIPE_WEBHOOK_SECRET_SANDBOX" : "STRIPE_WEBHOOK_SECRET_LIVE";
      results.push({
        scope, endpoint_id: endpoint.id, url, created: !existing, signing_secret: signingSecret,
        secret_env_var: scope === "platform" ? `${base}_PLATFORM` : base,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true, events, endpoints: results,
        note: "Save each returned signing_secret as its secret_env_var, then redeploy stripe-connect-webhook. Secrets are only returned when an endpoint is created.",
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
