// PUBLIC endpoint — receives contact/support form submissions.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimits, getClientIp, rateLimited, RATE_RULES } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORT_EMAIL = "help@booksuite.online";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();
    // Honeypot: real users never fill this.
    if (String(body?.company ?? "").trim().length > 0) return json({ ok: true });

    if (!name || name.length > 100) return json({ error: "Please enter your name (100 characters max)." }, 400);
    if (!email || email.length > 255 || !isEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
    if (!subject || subject.length > 150) return json({ error: "Please enter a subject (150 characters max)." }, 400);
    if (message.length < 10 || message.length > 2000) {
      return json({ error: "Your message must be between 10 and 2000 characters." }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const allowed = await checkRateLimits(
      [
        { rule: RATE_RULES.contact, identifier: `ip:${getClientIp(req)}` },
        { rule: RATE_RULES.contact, identifier: `email:${email}` },
      ],
      admin,
    );
    if (!allowed) return rateLimited(corsHeaders, 3600);

    const { data: row, error } = await admin
      .from("contact_messages")
      .insert({ name, email, subject, message })
      .select("id")
      .single();
    if (error) throw error;

    // Notify support, then confirm to the sender. Neither failure blocks the save.
    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-received-owner",
          recipientEmail: SUPPORT_EMAIL,
          idempotencyKey: `contact-owner-${row.id}`,
          templateData: { name, email, subject, message },
        },
      });
    } catch (e) {
      console.error("owner notification failed", e);
    }

    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: email,
          idempotencyKey: `contact-confirm-${row.id}`,
          templateData: { name, subject, message },
        },
      });
    } catch (e) {
      console.error("confirmation email failed", e);
    }

    return json({ ok: true, id: row.id });
  } catch (e) {
    console.error("submit-contact error", e);
    return json({ error: "Something went wrong. Please email help@booksuite.online." }, 500);
  }
});
