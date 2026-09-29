import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Fills public_holidays for a country (this year + next) from the free
// Nager.Date API. Called when an owner picks their holiday country in
// Settings. Authenticated callers only; the table is world-readable anyway,
// so the only thing to protect is write amplification — a cheap rate limit.
const ALLOWED_COUNTRIES = new Set([
  "GB", "US", "IE", "CA", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "BE",
  "SE", "NO", "DK", "FI", "PL", "PT", "AT", "CH",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await caller.auth.getUser();
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Sign in required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let country = "";
  try {
    country = String((await req.json()).country ?? "").trim().toUpperCase();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!ALLOWED_COUNTRIES.has(country)) {
    return new Response(JSON.stringify({ error: "Unsupported country" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const years = [new Date().getFullYear(), new Date().getFullYear() + 1];
  const rows: { country: string; holiday_date: string; name: string }[] = [];

  for (const year of years) {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    if (!res.ok) continue;
    const list = (await res.json()) as { date: string; localName?: string; name?: string }[];
    for (const h of list) {
      if (h?.date) rows.push({ country, holiday_date: h.date, name: h.localName || h.name || "Public holiday" });
    }
  }

  if (rows.length > 0) {
    const { error } = await admin
      .from("public_holidays")
      .upsert(rows, { onConflict: "country,holiday_date", ignoreDuplicates: true });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, count: rows.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
