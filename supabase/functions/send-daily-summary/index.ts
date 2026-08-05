// Daily platform summary for the BookSuite owner. Triggered by pg_cron each evening.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { adminAlertEmail, money } from "../_shared/notify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const nameOf = (m: Map<string, string>, id: string) => m.get(id) || "Unknown business";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`;
  if (auth !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const dateLabel = now.toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London",
    });

    const [profilesRes, subsRes, bookingsRes, emailRes] = await Promise.all([
      admin.from("profiles").select("user_id, display_name, created_at").gte("created_at", since),
      admin.from("subscriptions").select("user_id, tier, subscribed, status, canceled_at, created_at, updated_at").gte("updated_at", since),
      admin.from("bookings").select("user_id, client_name, service, deposit_amount, platform_fee_amount, payment_status, refund_id, created_at").gte("created_at", since),
      admin.from("email_send_log").select("message_id, template_name, status, error_message, created_at").gte("created_at", since).in("status", ["dlq", "failed"]),
    ]);

    const newProfiles = profilesRes.data ?? [];
    const subs = subsRes.data ?? [];
    const bookings = bookingsRes.data ?? [];
    const failedEmails = emailRes.data ?? [];

    // Business names for every user id we reference.
    const ids = Array.from(new Set([
      ...newProfiles.map((p: any) => p.user_id),
      ...subs.map((s: any) => s.user_id),
      ...bookings.map((b: any) => b.user_id),
    ].filter(Boolean)));
    const names = new Map<string, string>();
    if (ids.length) {
      const { data: bsRows } = await admin
        .from("business_settings")
        .select("user_id, business_name")
        .in("user_id", ids);
      (bsRows ?? []).forEach((r: any) => names.set(r.user_id, r.business_name || "Unnamed business"));
    }

    const started = subs.filter((s: any) => s.subscribed === true && new Date(s.created_at) >= new Date(since));
    const cancelled = subs.filter((s: any) => s.canceled_at && new Date(s.canceled_at) >= new Date(since));

    const paid = bookings.filter((b: any) => b.payment_status === "paid");
    const refunded = bookings.filter((b: any) => !!b.refund_id);
    const gross = paid.reduce((t: number, b: any) => t + Number(b.deposit_amount || 0), 0);
    const fees = paid.reduce((t: number, b: any) => t + Number(b.platform_fee_amount || 0), 0);

    const quiet =
      newProfiles.length === 0 && started.length === 0 && cancelled.length === 0 &&
      bookings.length === 0 && failedEmails.length === 0;

    const stats = [
      { label: "New signups", value: String(newProfiles.length) },
      { label: "Subscriptions started", value: String(started.length) },
      { label: "Subscriptions cancelled", value: String(cancelled.length) },
      { label: "Bookings taken", value: String(bookings.length) },
      { label: "Gross payments", value: money(gross) },
      { label: "Platform fees earned", value: money(fees) },
      { label: "Refunds issued", value: String(refunded.length) },
      { label: "Failed emails", value: String(failedEmails.length) },
    ];

    const groups: Array<{ title: string; lines: string[] }> = [];
    if (newProfiles.length) {
      groups.push({
        title: "New signups",
        lines: newProfiles.map((p: any) => nameOf(names, p.user_id) !== "Unknown business"
          ? nameOf(names, p.user_id)
          : (p.display_name || "New account")),
      });
    }
    if (started.length) {
      groups.push({
        title: "Subscriptions started",
        lines: started.map((s: any) => `${nameOf(names, s.user_id)} — ${s.tier ?? "unknown"} plan`),
      });
    }
    if (cancelled.length) {
      groups.push({
        title: "Subscriptions cancelled",
        lines: cancelled.map((s: any) => `${nameOf(names, s.user_id)} — ${s.tier ?? "unknown"} plan`),
      });
    }
    if (paid.length) {
      groups.push({
        title: "Bookings paid",
        lines: paid.slice(0, 25).map((b: any) =>
          `${nameOf(names, b.user_id)} — ${b.client_name}, ${b.service}, ${money(Number(b.deposit_amount || 0))} (fee ${money(Number(b.platform_fee_amount || 0))})`),
      });
    }
    if (failedEmails.length) {
      groups.push({
        title: "Emails that failed",
        lines: failedEmails.slice(0, 15).map((e: any) =>
          `${e.template_name} — ${e.status}${e.error_message ? `: ${String(e.error_message).slice(0, 120)}` : ""}`),
      });
    }

    const headline = quiet
      ? "No activity across BookSuite in the last 24 hours."
      : `${newProfiles.length} new signup(s), ${bookings.length} booking(s), ${money(gross)} processed, ${money(fees)} in platform fees.`;

    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "platform-daily-summary",
        recipientEmail: adminAlertEmail(),
        idempotencyKey: `daily-summary-${now.toISOString().slice(0, 10)}`,
        templateData: { dateLabel, headline, stats, groups, quiet },
      },
    });

    return new Response(JSON.stringify({ ok: true, quiet, signups: newProfiles.length, bookings: bookings.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-daily-summary error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
