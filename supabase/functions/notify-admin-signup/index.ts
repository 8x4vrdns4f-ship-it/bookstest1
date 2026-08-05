// Called by a database trigger when a new profile (account) is created.
// Sends the BookSuite owner an instant signup alert.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { notifyAdmin } from "../_shared/notify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id ?? "");
    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let email = "";
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      email = data?.user?.email || "";
    } catch { /* ignore */ }

    const { data: bs } = await admin
      .from("business_settings")
      .select("business_name, business_category, company_code")
      .eq("user_id", userId)
      .maybeSingle();

    await notifyAdmin(admin, {
      eventTitle: "New signup",
      eventSummary: "A new account was created on BookSuite.",
      businessName: (bs as any)?.business_name || String(body?.display_name ?? "") || email,
      rows: [
        { label: "Email", value: email || "—" },
        { label: "Category", value: (bs as any)?.business_category || "—" },
        { label: "Company code", value: (bs as any)?.company_code || "—" },
        { label: "Account type", value: (bs as any) ? "Business" : "Employee / staff" },
      ],
      idempotencyKey: `signup-${userId}`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-admin-signup error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
