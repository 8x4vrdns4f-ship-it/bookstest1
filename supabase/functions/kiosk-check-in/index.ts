// Public self check-in for the kiosk page. No sign-in; runs with server rights,
// rate-limited (fail closed), and reveals nothing about why a check-in failed.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  RATE_RULES, checkRateLimitStrict, getClientIp, peekRateLimitStrict,
} from "../_shared/rate-limit.ts";
import {
  GENERIC_FAILURE, firstName, insideWindow, normaliseCode, normaliseCompanyCode, statusDecision,
} from "./rules.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: GENERIC_FAILURE }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { /* fall through */ }
  const action = body?.action;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const companyCode = normaliseCompanyCode(body?.companyCode);

  const loadBusiness = async () => {
    if (!companyCode) return null;
    const { data } = await admin.from("business_settings")
      .select("user_id, business_name, self_checkin_enabled, timezone")
      .eq("company_code", companyCode).maybeSingle();
    return data;
  };

  if (action === "status") {
    const biz = await loadBusiness();
    const enabled = !!biz?.self_checkin_enabled;
    return json({ enabled, businessName: enabled ? biz!.business_name ?? "" : "" });
  }

  if (action !== "check_in") return json({ ok: false, error: GENERIC_FAILURE }, 400);

  const ip = getClientIp(req);
  const fail = async () => {
    await checkRateLimitStrict(RATE_RULES.checkinFailIp, ip, admin);
    return json({ ok: false, error: GENERIC_FAILURE });
  };

  // 1. Rate limits (fail closed)
  const allowed =
    (await peekRateLimitStrict(RATE_RULES.checkinFailIp, ip, admin)) &&
    (await checkRateLimitStrict(RATE_RULES.checkinIp, ip, admin)) &&
    (await checkRateLimitStrict(RATE_RULES.checkinCompany, companyCode ?? "invalid", admin));
  if (!allowed) return json({ ok: false, error: GENERIC_FAILURE }, 429);

  // 2. Business + switch
  const biz = await loadBusiness();
  if (!biz?.self_checkin_enabled) return fail();

  // 3. Booking of that business
  const code = normaliseCode(body?.code);
  if (!code) return fail();
  const { data: rows } = await admin.from("bookings")
    .select("id, client_name, service, booking_date, booking_time, status")
    .eq("user_id", biz.user_id)
    .ilike("confirmation_code", code)
    .order("booking_date", { ascending: false })
    .limit(1);
  const b = rows?.[0];
  if (!b) return fail();

  const result = { ok: true, firstName: firstName(b.client_name), service: b.service, time: String(b.booking_time).slice(0, 5) };

  // 4. Status
  const decision = statusDecision(b.status);
  if (decision === "already") return json({ ...result, alreadyCheckedIn: true });
  if (decision === "reject") return fail();

  // 5. Time window in business timezone
  if (!insideWindow(b.booking_date, String(b.booking_time), new Date(), biz.timezone || "Europe/London")) return fail();

  const { data: updated, error } = await admin.from("bookings")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", b.id).eq("status", "confirmed")
    .select("id");
  if (error) { console.error("check-in update failed", error.message); return json({ ok: false, error: GENERIC_FAILURE }); }
  if (!updated?.length) return json({ ...result, alreadyCheckedIn: true });
  return json({ ...result, alreadyCheckedIn: false });
});
