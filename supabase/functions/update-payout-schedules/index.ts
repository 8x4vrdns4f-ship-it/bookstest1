// Admin-only, idempotent: sets every connected account's payout schedule to weekly / Monday.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: u } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!u?.user) return json({ error: "Unauthorized" }, 401);
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rows, error } = await admin.from("connect_accounts").select("stripe_account_id, environment");
  if (error) return json({ error: error.message }, 500);

  const results: { account: string; env: string; status: string; error?: string }[] = [];
  for (const r of rows ?? []) {
    const env = r.environment as StripeEnv;
    try {
      const stripe = createStripeClient(env);
      const acct = await stripe.accounts.retrieve(r.stripe_account_id);
      const s = acct.settings?.payouts?.schedule;
      if (s?.interval === "weekly" && s?.weekly_anchor === "monday") {
        results.push({ account: r.stripe_account_id, env, status: "already_weekly" });
        continue;
      }
      await stripe.accounts.update(r.stripe_account_id, {
        settings: { payouts: { schedule: { interval: "weekly", weekly_anchor: "monday" } } },
      });
      results.push({ account: r.stripe_account_id, env, status: "updated" });
    } catch (e: any) {
      results.push({ account: r.stripe_account_id, env, status: "failed", error: e?.raw?.message || e?.message || String(e) });
    }
  }
  return json({ results });
});
