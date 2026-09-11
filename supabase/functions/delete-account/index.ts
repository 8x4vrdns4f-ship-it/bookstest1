import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";
import { notifyAdmin } from "../_shared/notify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const anon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData } = await anon.auth.getUser(token);
    const user = userData.user;
    if (!user?.id) return json({ error: "Not authenticated" }, 401);

    let confirm = "";
    try {
      const body = await req.json();
      confirm = String(body?.confirm ?? "");
    } catch (_) { /* no body */ }
    if (confirm.trim().toUpperCase() !== "DELETE") {
      return json({ error: "Type DELETE to confirm." }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Platform owner account cannot be self-deleted.
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleRow) return json({ error: "The platform owner account cannot be deleted here." }, 403);

    const { data: biz } = await admin
      .from("business_settings")
      .select("business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    // Best-effort: cancel any live Stripe subscription so billing stops.
    try {
      const { data: subRow } = await admin
        .from("subscriptions")
        .select("stripe_subscription_id, stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (subRow?.stripe_subscription_id) {
        const stripe = createStripeClient(resolveEnv(undefined));
        await stripe.subscriptions.cancel(subRow.stripe_subscription_id, { prorate: false });
      }
    } catch (stripeErr) {
      console.error("[delete-account] stripe cancel failed", stripeErr);
    }

    // Delete owned data, children before parents.
    const childTables = [
      "reviews",
      "employee_notifications",
      "employee_shifts",
      "time_off_requests",
      "rebooking_reminders",
      "waitlist_entries",
      "campaigns",
      "date_overrides",
      "promo_codes",
      "pending_bookings",
      "bookings",
      "employees",
      "employee_join_requests",
      "company_roles",
      "resources",
      "services",
      "clients",
      "connect_accounts",
      "subscriptions",
      "business_settings",
      "profiles",
      "user_roles",
    ];

    for (const table of childTables) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id);
      if (error) console.error(`[delete-account] failed clearing ${table}`, error.message);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) return json({ error: delErr.message }, 500);

    try {
      await notifyAdmin(admin, {
        eventTitle: "Account deleted",
        businessName: biz?.business_name || user.email || "",
        rows: [{ label: "Account", value: user.email || user.id }],
        idempotencyKey: `account-deleted-${user.id}`,
      });
    } catch (notifyErr) {
      console.error("[delete-account] admin notify failed", notifyErr);
    }

    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[delete-account]", msg);
    return json({ error: msg }, 500);
  }
});
