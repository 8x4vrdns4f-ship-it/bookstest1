// Temporary helper: sends one sample of each platform alert to the owner inbox
// so the layout can be reviewed. Service-role only.
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

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const stamp = Date.now();

  const alerts = [
    {
      eventTitle: "New signup",
      eventSummary: "A new account was created on BookSuite.",
      businessName: "Sharp Cuts Barbers",
      rows: [
        { label: "Email", value: "owner@sharpcuts.example" },
        { label: "Category", value: "Barbershop" },
        { label: "Company code", value: "BS-K7QM2P" },
        { label: "Account type", value: "Business" },
      ],
      idempotencyKey: `test-signup-${stamp}`,
    },
    {
      eventTitle: "Subscription started",
      eventSummary: "A business activated a paid plan.",
      businessName: "Sharp Cuts Barbers",
      rows: [
        { label: "Account", value: "owner@sharpcuts.example" },
        { label: "Plan", value: "gold" },
        { label: "Renews", value: "05/09/2026" },
      ],
      idempotencyKey: `test-sub-start-${stamp}`,
    },
    {
      eventTitle: "Subscription cancelled",
      businessName: "Luna Nail Studio",
      rows: [
        { label: "Account", value: "hello@lunanails.example" },
        { label: "Plan", value: "silver" },
      ],
      idempotencyKey: `test-sub-cancel-${stamp}`,
    },
    {
      eventTitle: "Booking paid in full",
      eventSummary: "A business took a booking payment through BookSuite.",
      businessName: "Sharp Cuts Barbers",
      rows: [
        { label: "Client", value: "James Whitfield" },
        { label: "Service", value: "Skin fade + beard trim" },
        { label: "Appointment", value: "12 Aug 2026 at 14:30" },
        { label: "Amount charged", value: "GBP 35.00" },
        { label: "Platform fee", value: "GBP 1.05" },
        { label: "Environment", value: "live" },
      ],
      idempotencyKey: `test-booking-paid-${stamp}`,
    },
    {
      eventTitle: "Booking refunded",
      businessName: "Luna Nail Studio",
      rows: [
        { label: "Client", value: "Priya Anand" },
        { label: "Service", value: "Gel manicure" },
        { label: "Refund amount", value: "GBP 15.00" },
      ],
      idempotencyKey: `test-refund-${stamp}`,
    },
    {
      eventTitle: "Payout account ready",
      eventSummary: "A business completed payout onboarding and can now accept payments.",
      businessName: "Sharp Cuts Barbers",
      rows: [
        { label: "Country", value: "GB" },
        { label: "Currency", value: "GBP" },
      ],
      idempotencyKey: `test-connect-ready-${stamp}`,
    },
  ];

  for (const a of alerts) {
    await notifyAdmin(admin, a);
  }

  return new Response(JSON.stringify({ ok: true, sent: alerts.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
