// Dashboard-wide assistant for business owners.
// Two phases:
//  1) { message, history, page } -> answers questions (read tools run here) or proposes a change set (no writes)
//  2) { apply: true, change_set } -> validates and applies the change set
// All reads and writes use the caller's JWT so RLS + tier-limit triggers apply.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const SETTINGS_FIELDS = [
  "business_name", "business_phone", "business_email", "business_address", "business_category",
  "currency", "timezone", "deposit_amount", "payment_mode", "working_hours", "auto_confirm",
  "allow_same_day", "buffer_minutes", "max_advance_days", "cancellation_hours",
  "pending_request_ttl_hours", "notify_new_booking", "notify_daily_summary",
  "notify_client_confirmation", "notify_client_reminder", "notify_client_review_request",
  "rebooking_reminder_enabled", "rebooking_reminder_days", "welcome_message", "accent_color",
  "resources_enabled", "resource_label", "party_size_enabled", "assignment_mode", "services_enabled",
];

type ChangeSet = {
  settings_patch?: Record<string, unknown>;
  resource_ops?: any[];
  service_ops?: any[];
  booking_ops?: any[];
  shift_ops?: any[];
  schedule_ops?: any[];
  time_off_ops?: any[];
  client_ops?: any[];
  campaign?: { subject?: string; body?: string } | null;
  summary?: string;
};

const TIME_RE = /^([01]\d|2[0-3]|24):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(cs: ChangeSet): string | null {
  const patch = cs.settings_patch || {};
  for (const k of Object.keys(patch)) {
    if (!SETTINGS_FIELDS.includes(k)) return `I can't change "${k}" from here.`;
  }
  if (patch.deposit_amount != null && Number(patch.deposit_amount) < 10) return "The deposit has to be at least £10.";
  if (patch.accent_color != null && !/^#[0-9a-fA-F]{6}$/.test(String(patch.accent_color))) return "That colour doesn't look like a valid hex colour.";
  if (patch.assignment_mode != null && !["client_pick", "auto"].includes(String(patch.assignment_mode))) return "Assignment must be either letting customers pick or automatic.";
  if (patch.payment_mode != null && !["deposit", "full", "none"].includes(String(patch.payment_mode))) return "Payment mode must be deposit, full or none.";
  if (patch.working_hours) {
    const wh: any = patch.working_hours;
    for (const d of DAY_KEYS) {
      const day = wh[d];
      if (!day) return "The opening hours need every day of the week.";
      if (typeof day.closed !== "boolean") return "Each day needs to say whether you're closed.";
      if (!TIME_RE.test(String(day.open)) || !TIME_RE.test(String(day.close))) return "Opening and closing times must look like 09:00.";
      if (!day.closed && String(day.close) <= String(day.open)) return "Closing time has to be after opening time.";
    }
  }
  for (const n of ["buffer_minutes", "max_advance_days", "cancellation_hours", "pending_request_ttl_hours", "rebooking_reminder_days"]) {
    if (patch[n] != null && (!Number.isFinite(Number(patch[n])) || Number(patch[n]) < 0)) return `"${n.replace(/_/g, " ")}" must be zero or more.`;
  }
  for (const op of cs.resource_ops || []) {
    if (!["create", "update", "delete"].includes(op.action)) return "Unsupported resource change.";
    if (op.action !== "create" && !op.id) return "Missing which resource to change.";
    if (op.action === "create" && !String(op.name || "").trim()) return "New resources need a name.";
    if (op.capacity != null && (!Number.isFinite(Number(op.capacity)) || Number(op.capacity) < 1)) return "Capacity must be at least 1.";
  }
  for (const op of cs.service_ops || []) {
    if (!["create", "update", "delete"].includes(op.action)) return "Unsupported service change.";
    if (op.action !== "create" && !op.id) return "Missing which service to change.";
    if (op.action === "create" && !String(op.name || "").trim()) return "New services need a name.";
    if (op.duration_minutes != null && (!Number.isFinite(Number(op.duration_minutes)) || Number(op.duration_minutes) < 5)) return "Services must be at least 5 minutes long.";
    if (op.price != null && op.price !== "" && (!Number.isFinite(Number(op.price)) || Number(op.price) < 0)) return "Price can't be negative.";
  }
  for (const op of cs.booking_ops || []) {
    if (!op.id) return "Missing which booking to change.";
    if (!["confirm", "decline", "complete", "no_show"].includes(op.action)) return "I can confirm, decline, complete or mark bookings as no-show. Cancel paid bookings from the booking itself so refunds are handled.";
  }
  for (const op of cs.shift_ops || []) {
    if (!["add", "update", "remove"].includes(op.action)) return "Unsupported shift change.";
    if (op.action === "add" && (!op.employee_id || !DATE_RE.test(String(op.date)))) return "New shifts need a team member and a date.";
    if (op.action !== "add" && !op.id) return "Missing which shift to change.";
    if (op.date != null && !DATE_RE.test(String(op.date))) return "Dates must look like 2026-10-20.";
    for (const t of [op.start_time, op.end_time]) if (t != null && !TIME_RE.test(String(t))) return "Shift times must look like 09:00.";
    if (op.action === "add" && (!op.start_time || !op.end_time)) return "New shifts need a start and end time.";
    if (op.start_time && op.end_time && String(op.end_time) <= String(op.start_time)) return "A shift has to end after it starts.";
  }
  for (const op of cs.schedule_ops || []) {
    if (!op.employee_id) return "Missing which team member's schedule to change.";
    if (op.action === "remove") continue;
    if (op.action !== "set") return "Unsupported schedule change.";
    if (!Array.isArray(op.weekdays) || !op.weekdays.length || op.weekdays.some((d: any) => !Number.isInteger(d) || d < 0 || d > 6)) return "Pick at least one working day.";
    if (!TIME_RE.test(String(op.start_time)) || !TIME_RE.test(String(op.end_time)) || String(op.end_time) <= String(op.start_time)) return "Schedule times must look like 09:00, and end after they start.";
    if (op.effective_from != null && !DATE_RE.test(String(op.effective_from))) return "Dates must look like 2026-10-20.";
  }
  for (const op of cs.time_off_ops || []) {
    if (!op.id || !["approve", "decline"].includes(op.action)) return "I can approve or decline time-off requests.";
  }
  for (const op of cs.client_ops || []) {
    if (!["create", "update"].includes(op.action)) return "I can add clients or update their details.";
    if (op.action === "update" && !op.id) return "Missing which client to change.";
    if (op.action === "create" && !String(op.name || "").trim()) return "New clients need a name.";
    if (op.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(op.email))) return "That email address doesn't look right.";
  }
  if (cs.campaign) {
    const s = String(cs.campaign.subject || "").trim(), b = String(cs.campaign.body || "").trim();
    if (s.length < 3 || s.length > 140) return "The email subject must be 3–140 characters.";
    if (b.length < 10 || b.length > 5000) return "The email message must be 10–5000 characters.";
  }
  return null;
}

const hasChanges = (cs: ChangeSet) =>
  (cs.settings_patch && Object.keys(cs.settings_patch).length > 0) ||
  ["resource_ops", "service_ops", "booking_ops", "shift_ops", "schedule_ops", "time_off_ops", "client_ops"].some((k) => ((cs as any)[k] || []).length > 0) ||
  !!cs.campaign;

const opArray = (props: Record<string, unknown>, required: string[]) => ({
  type: "array",
  items: { type: "object", properties: props, required },
});

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_bookings",
      description: "Look up bookings and booking numbers (counts, revenue, popular services, busiest days, no-shows) between two dates. Use for any question about bookings or performance.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "YYYY-MM-DD inclusive" },
          to: { type: "string", description: "YYYY-MM-DD inclusive" },
          status: { type: "string", description: "Optional: pending, confirmed, completed, cancelled, no_show" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clients",
      description: "Search clients by name/email, or find clients who haven't booked in N days. Returns last visit and visit count.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          inactive_days: { type: "number", description: "Only clients whose last booking is older than this many days" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_team",
      description: "Team members, their weekly schedules, shifts between two dates (with shift ids), pending time-off requests (with ids) and this year's leave balances.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "YYYY-MM-DD" },
          to: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_change",
      description: "Propose changes for the owner to approve. Nothing is saved until they press Apply. Only include what should change. Look up ids with the get_* tools first.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Short plain-English bullet list of every change, for the owner to confirm." },
          settings_patch: { type: "object", description: "Partial business settings. working_hours must contain all 7 day keys (mon..sun) with open, close, closed.", additionalProperties: true },
          resource_ops: opArray({ action: { type: "string", enum: ["create", "update", "delete"] }, id: { type: "string" }, name: { type: "string" }, capacity: { type: "number" }, active: { type: "boolean" } }, ["action"]),
          service_ops: opArray({ action: { type: "string", enum: ["create", "update", "delete"] }, id: { type: "string" }, name: { type: "string" }, duration_minutes: { type: "number" }, price: { type: "number" }, active: { type: "boolean" } }, ["action"]),
          booking_ops: opArray({ action: { type: "string", enum: ["confirm", "decline", "complete", "no_show"] }, id: { type: "string" } }, ["action", "id"]),
          shift_ops: opArray({ action: { type: "string", enum: ["add", "update", "remove"] }, id: { type: "string" }, employee_id: { type: "string" }, date: { type: "string" }, start_time: { type: "string" }, end_time: { type: "string" } }, ["action"]),
          schedule_ops: opArray({ action: { type: "string", enum: ["set", "remove"] }, employee_id: { type: "string" }, weekdays: { type: "array", items: { type: "number" }, description: "0=Sun..6=Sat" }, start_time: { type: "string" }, end_time: { type: "string" }, effective_from: { type: "string" } }, ["action", "employee_id"]),
          time_off_ops: opArray({ action: { type: "string", enum: ["approve", "decline"] }, id: { type: "string" }, note: { type: "string" } }, ["action", "id"]),
          client_ops: opArray({ action: { type: "string", enum: ["create", "update"] }, id: { type: "string" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, notes: { type: "string" } }, ["action"]),
          campaign: { type: "object", description: "An email to send to all clients. The owner presses Send.", properties: { subject: { type: "string" }, body: { type: "string" } } },
        },
        required: ["summary"],
      },
    },
  },
];

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const db = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });

    const { data: userData, error: userErr } = await db.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);
    const uid = user.id;

    const { data: emp } = await db.from("employees").select("id").eq("auth_user_id", uid).maybeSingle();
    if (emp) return json({ error: "Only the business owner can use the assistant." }, 403);

    const body = await req.json().catch(() => ({}));

    // ---------- Phase 2: apply ----------
    if (body?.apply) {
      const cs: ChangeSet = body.change_set || {};
      const invalid = validate(cs);
      if (invalid) return json({ error: invalid }, 400);
      const fail = (e: any) => json({ error: e?.message || "Couldn't save that change." }, 400);
      const emails: any[] = [];
      let campaignSent = false;

      if (cs.settings_patch && Object.keys(cs.settings_patch).length) {
        const { error } = await db.from("business_settings").upsert({ user_id: uid, ...cs.settings_patch }, { onConflict: "user_id" });
        if (error) return fail(error);
      }

      for (const op of cs.resource_ops || []) {
        let r;
        if (op.action === "create") r = await db.from("resources").insert({ user_id: uid, name: String(op.name).trim(), capacity: Math.max(1, Math.floor(Number(op.capacity ?? 1))), active: op.active ?? true });
        else if (op.action === "update") {
          const p: Record<string, unknown> = {};
          if (op.name != null) p.name = String(op.name).trim();
          if (op.capacity != null) p.capacity = Math.max(1, Math.floor(Number(op.capacity)));
          if (op.active != null) p.active = !!op.active;
          r = await db.from("resources").update(p).eq("id", op.id).eq("user_id", uid);
        } else r = await db.from("resources").delete().eq("id", op.id).eq("user_id", uid);
        if (r.error) return fail(r.error);
      }

      for (const op of cs.service_ops || []) {
        let r;
        if (op.action === "create") r = await db.from("services").insert({ user_id: uid, name: String(op.name).trim(), duration_minutes: Math.max(5, Math.floor(Number(op.duration_minutes ?? 30))), price: op.price == null || op.price === "" ? null : Number(op.price), active: op.active ?? true });
        else if (op.action === "update") {
          const p: Record<string, unknown> = {};
          if (op.name != null) p.name = String(op.name).trim();
          if (op.duration_minutes != null) p.duration_minutes = Math.max(5, Math.floor(Number(op.duration_minutes)));
          if (op.price !== undefined) p.price = op.price == null || op.price === "" ? null : Number(op.price);
          if (op.active != null) p.active = !!op.active;
          r = await db.from("services").update(p).eq("id", op.id).eq("user_id", uid);
        } else r = await db.from("services").delete().eq("id", op.id).eq("user_id", uid);
        if (r.error) return fail(r.error);
      }

      if ((cs.booking_ops || []).length) {
        const { data: s } = await db.from("business_settings").select("business_name").eq("user_id", uid).maybeSingle();
        const businessName = s?.business_name || "";
        for (const op of cs.booking_ops || []) {
          const { data: b, error: be } = await db.from("bookings").select("id, status, client_name, client_email, service, booking_date, booking_time").eq("id", op.id).eq("user_id", uid).maybeSingle();
          if (be || !b) return json({ error: "I couldn't find that booking." }, 400);
          const base = { businessName, clientName: b.client_name, service: b.service, date: fmtDate(b.booking_date), time: String(b.booking_time || "").slice(0, 5) };
          if (op.action === "confirm") {
            if (b.status !== "pending") return json({ error: `${b.client_name}'s booking isn't waiting for approval.` }, 400);
            const { data: code, error: ce } = await db.rpc("generate_booking_code");
            if (ce || !code) return fail(ce);
            const { error } = await db.from("bookings").update({ status: "confirmed", confirmation_code: code }).eq("id", b.id);
            if (error) return fail(error);
            if (b.client_email) emails.push({ template: "booking-confirmed", to: b.client_email, key: `booking-confirm-${b.id}`, data: { ...base, confirmationCode: code } });
          } else if (op.action === "decline") {
            if (b.status !== "pending") return json({ error: `${b.client_name}'s booking isn't waiting for approval.` }, 400);
            // Goes through cancel-booking-owner so any payment is refunded and the client is emailed there.
            const res = await fetch(`${supabaseUrl}/functions/v1/cancel-booking-owner`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, apikey: anonKey, "Content-Type": "application/json" },
              body: JSON.stringify({ booking_id: b.id, mode: "decline", reason: "Declined by business" }),
            });
            const out = await res.json().catch(() => ({}));
            if (!res.ok || !out?.ok) return json({ error: out?.error || "I couldn't decline that booking." }, 400);
          } else {
            const { error } = await db.from("bookings").update({ status: op.action === "complete" ? "completed" : "no_show" }).eq("id", b.id);
            if (error) return fail(error);
          }
        }
      }

      for (const op of cs.shift_ops || []) {
        let r;
        if (op.action === "add") r = await db.from("employee_shifts").insert({ user_id: uid, employee_id: op.employee_id, shift_date: op.date, start_time: op.start_time, end_time: op.end_time, is_override: true });
        else if (op.action === "update") {
          const p: Record<string, unknown> = { is_override: true };
          if (op.date) p.shift_date = op.date;
          if (op.start_time) p.start_time = op.start_time;
          if (op.end_time) p.end_time = op.end_time;
          r = await db.from("employee_shifts").update(p).eq("id", op.id).eq("user_id", uid);
        } else {
          const { data: sh } = await db.from("employee_shifts").select("employee_id, shift_date").eq("id", op.id).eq("user_id", uid).maybeSingle();
          r = await db.from("employee_shifts").delete().eq("id", op.id).eq("user_id", uid);
          // Remember the day off so re-applying the weekly schedule doesn't bring it back.
          if (!r.error && sh) await db.from("employee_shift_skips").insert({ user_id: uid, employee_id: sh.employee_id, skip_date: sh.shift_date });
        }
        if (r.error) return fail(r.error);
      }

      const today = new Date().toISOString().slice(0, 10);
      for (const op of cs.schedule_ops || []) {
        if (op.action === "remove") {
          const { error } = await db.from("employee_schedules").delete().eq("employee_id", op.employee_id).eq("user_id", uid);
          if (error) return fail(error);
          await db.rpc("apply_employee_schedule", { _employee_id: op.employee_id, _from: today, _replace: true });
        } else {
          const from = op.effective_from && op.effective_from > today ? op.effective_from : today;
          const { error } = await db.from("employee_schedules").upsert({ user_id: uid, employee_id: op.employee_id, weekdays: op.weekdays, start_time: op.start_time, end_time: op.end_time, effective_from: from }, { onConflict: "employee_id" });
          if (error) return fail(error);
          const { error: e2 } = await db.rpc("apply_employee_schedule", { _employee_id: op.employee_id, _from: from, _replace: true });
          if (e2) return fail(e2);
        }
      }

      for (const op of cs.time_off_ops || []) {
        const { error } = await db.from("time_off_requests").update({ status: op.action === "approve" ? "approved" : "declined", decided_by: uid, decided_at: new Date().toISOString(), decision_note: op.note?.trim() || null }).eq("id", op.id).eq("user_id", uid);
        if (error) return fail(error);
      }

      for (const op of cs.client_ops || []) {
        const p: Record<string, unknown> = {};
        for (const k of ["name", "email", "phone", "notes"]) if (op[k] != null) p[k] = String(op[k]).trim() || null;
        const r = op.action === "create"
          ? await db.from("clients").insert({ user_id: uid, ...p })
          : await db.from("clients").update(p).eq("id", op.id).eq("user_id", uid);
        if (r.error) return fail(r.error);
      }

      if (cs.campaign) {
        const { data: created, error } = await db.from("campaigns").insert({ user_id: uid, subject: cs.campaign.subject!.trim(), body: cs.campaign.body!.trim() }).select("id").single();
        if (error || !created) return fail(error);
        const res = await fetch(`${supabaseUrl}/functions/v1/send-campaign`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: anonKey },
          body: JSON.stringify({ campaign_id: created.id }),
        });
        if (!res.ok) {
          const t = await res.json().catch(() => ({}));
          return json({ error: t?.error || "The email couldn't be sent. It's saved as a draft in Campaigns." }, 400);
        }
        campaignSent = true;
      }

      return json({ ok: true, emails, campaign_sent: campaignSent });
    }

    // ---------- Phase 1: chat ----------
    const message = String(body?.message || "").trim();
    if (!message) return json({ error: "Type what you'd like to do." }, 400);
    if (message.length > 2000) return json({ error: "That message is a bit long — try shortening it." }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "The assistant isn't configured yet." }, 500);

    const { error: quotaErr } = await db.rpc("consume_assistant_request");
    if (quotaErr) {
      const m = quotaErr.message || "";
      if (m.includes("ASSISTANT_COOLDOWN")) return json({ error: "Give it a few seconds before your next request." }, 429);
      if (m.includes("ASSISTANT_NO_PLAN")) return json({ error: "The assistant needs an active plan." }, 403);
      if (m.includes("ASSISTANT_LIMIT")) return json({ error: "You've used all your assistant requests for this month. Upgrade your plan for more, or wait until next month.", limit_reached: true }, 429);
      console.error("quota error", quotaErr);
      return json({ error: "Couldn't check your assistant allowance." }, 500);
    }

    const [{ data: settings }, { data: resources }, { data: services }, { data: employees }] = await Promise.all([
      db.from("business_settings").select("*").eq("user_id", uid).maybeSingle(),
      db.from("resources").select("id, name, capacity, active").eq("user_id", uid).order("sort_order"),
      db.from("services").select("id, name, duration_minutes, price, active").eq("user_id", uid).order("sort_order"),
      db.from("employees").select("id, name, position").eq("user_id", uid),
    ]);

    const runTool = async (name: string, args: any): Promise<unknown> => {
      const clampRange = (f: string, t: string) => {
        const from = DATE_RE.test(f) ? f : new Date().toISOString().slice(0, 10);
        let to = DATE_RE.test(t) ? t : from;
        if (to < from) to = from;
        return { from, to };
      };
      if (name === "get_bookings") {
        const { from, to } = clampRange(String(args.from || ""), String(args.to || ""));
        let q = db.from("bookings").select("id, client_name, client_id, service, booking_date, booking_time, status, service_price, charge_amount, assigned_employee_id").eq("user_id", uid).gte("booking_date", from).lte("booking_date", to).order("booking_date").order("booking_time").limit(1000);
        if (args.status) q = q.eq("status", String(args.status));
        const { data, error } = await q;
        if (error) return { error: error.message };
        const rows = data || [];
        const byStatus: Record<string, number> = {}, byService: Record<string, number> = {}, byWeekday: Record<string, number> = {};
        let revenue = 0;
        const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (const b of rows) {
          byStatus[b.status] = (byStatus[b.status] || 0) + 1;
          if (!["cancelled", "cancelled_by_client", "declined"].includes(b.status)) {
            byService[b.service || "Other"] = (byService[b.service || "Other"] || 0) + 1;
            const day = wd[new Date(b.booking_date + "T12:00:00Z").getUTCDay()];
            byWeekday[day] = (byWeekday[day] || 0) + 1;
            revenue += Number(b.service_price ?? b.charge_amount ?? 0) || 0;
          }
        }
        return {
          from, to, total: rows.length, by_status: byStatus, by_service: byService, by_weekday: byWeekday,
          estimated_revenue: Math.round(revenue * 100) / 100,
          bookings: rows.slice(0, 40).map((b) => ({ id: b.id, client: b.client_name, service: b.service, date: b.booking_date, time: String(b.booking_time || "").slice(0, 5), status: b.status })),
          note: rows.length > 40 ? `Only the first 40 of ${rows.length} are listed.` : undefined,
        };
      }
      if (name === "get_clients") {
        let q = db.from("clients").select("id, name, email, phone, notes, created_at").eq("user_id", uid).limit(500);
        if (args.search) {
          const s = String(args.search).replace(/[%,()]/g, "");
          q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%`);
        }
        const { data: clients, error } = await q;
        if (error) return { error: error.message };
        const ids = (clients || []).map((c) => c.id);
        const { data: bk } = ids.length
          ? await db.from("bookings").select("client_id, booking_date, status").eq("user_id", uid).in("client_id", ids.slice(0, 300))
          : { data: [] as any[] };
        const stats: Record<string, { last?: string; visits: number }> = {};
        for (const b of bk || []) {
          if (!b.client_id || ["cancelled", "cancelled_by_client"].includes(b.status)) continue;
          const s = (stats[b.client_id] ||= { visits: 0 });
          s.visits++;
          if (!s.last || b.booking_date > s.last) s.last = b.booking_date;
        }
        let list = (clients || []).map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, notes: c.notes, last_booking: stats[c.id]?.last || null, bookings: stats[c.id]?.visits || 0 }));
        if (args.inactive_days) {
          const cutoff = new Date(Date.now() - Number(args.inactive_days) * 86400000).toISOString().slice(0, 10);
          list = list.filter((c) => c.last_booking && c.last_booking < cutoff);
        }
        return { total_clients_matched: list.length, clients: list.slice(0, 40) };
      }
      if (name === "get_team") {
        const { from, to } = clampRange(String(args.from || ""), String(args.to || ""));
        const [{ data: shifts }, { data: schedules }, { data: timeOff }] = await Promise.all([
          db.from("employee_shifts").select("id, employee_id, shift_date, start_time, end_time").eq("user_id", uid).gte("shift_date", from).lte("shift_date", to).order("shift_date").limit(400),
          db.from("employee_schedules").select("employee_id, weekdays, start_time, end_time, effective_from").eq("user_id", uid),
          db.from("time_off_requests").select("id, employee_id, start_date, end_date, reason, status").eq("user_id", uid).in("status", ["pending", "approved"]).gte("end_date", new Date().toISOString().slice(0, 10)).limit(50),
        ]);
        const year = new Date().getFullYear();
        const balances = await Promise.all((employees || []).map(async (e) => {
          const { data } = await db.rpc("get_leave_balance", { _employee_id: e.id, _year: year });
          return { employee_id: e.id, balance: Array.isArray(data) ? data[0] : data };
        }));
        return {
          from, to, team: employees || [],
          weekly_schedules: (schedules || []).map((s) => ({ ...s, note: "weekdays 0=Sun..6=Sat" })),
          shifts: (shifts || []).map((s) => ({ ...s, start_time: String(s.start_time).slice(0, 5), end_time: String(s.end_time).slice(0, 5) })),
          time_off: timeOff || [], leave_balances: balances,
        };
      }
      return { error: "Unknown tool" };
    };

    const now = new Date();
    const context = {
      today: now.toISOString().slice(0, 10),
      weekday: now.toLocaleDateString("en-GB", { weekday: "long" }),
      page: String(body?.page || "").slice(0, 60),
      settings: settings ? Object.fromEntries(Object.entries(settings).filter(([k]) => SETTINGS_FIELDS.includes(k))) : {},
      resources: resources || [],
      services: services || [],
      team: employees || [],
    };

    const system = `You are the BookSuite assistant inside a business owner's dashboard. BookSuite is a booking platform for service businesses. You answer questions about their business and prepare changes for them.

You can look things up with get_bookings, get_clients and get_team. You can prepare changes with propose_change: settings (${SETTINGS_FIELDS.join(", ")}), resources, services, bookings (confirm/decline pending requests, mark completed or no-show), one-off shifts (add/update/remove), weekly schedules, time-off approvals, clients (add/update), and an email to all clients (campaign).

Rules:
- Look up real data before answering questions or preparing changes that need ids. Never invent ids, numbers or names.
- For changes, call propose_change once with everything. Never say a change is done — the owner still has to press Apply.
- working_hours must include all seven keys mon..sun, each { open: "HH:MM", close: "HH:MM", closed: boolean }, starting from their current hours.
- Deposits at least 10. Services at least 5 minutes. Capacity at least 1. Times HH:MM, dates YYYY-MM-DD. Interpret "tomorrow", "Friday" etc. relative to today.
- Cancelling paid or confirmed bookings, inviting or removing staff, roles, promo codes, billing/subscription, payments setup, account deletion and passwords are not available here — say where to do it in the dashboard instead.
- Campaign emails: write a warm, short email in the business's voice; it goes to all their clients. Never include made-up discounts the owner didn't ask for.
- Revenue figures are estimates from booked service prices; say so.
- Answers: short, friendly, plain English, markdown allowed (short lists, bold). No field names or jargon. Currency: ${settings?.currency || "GBP"}.

Their current setup (JSON):
${JSON.stringify(context)}`;

    const history = Array.isArray(body?.history)
      ? body.history.slice(-10).filter((m: any) => m && typeof m.content === "string" && ["user", "assistant"].includes(m.role)).map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }))
      : [];

    const messages: any[] = [{ role: "system", content: system }, ...history, { role: "user", content: message }];

    for (let step = 0; step < 6; step++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({ model: "google/gemini-3.7-flash", messages, tools: TOOLS }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        if (res.status === 429) return json({ error: "The assistant is busy right now — try again in a moment." }, 429);
        if (res.status === 402) return json({ error: "The assistant is out of credit. Please top up to keep using it." }, 402);
        if (res.status === 403) return json({ error: "The assistant isn't available right now." }, 403);
        return json({ error: "The assistant couldn't answer just now." }, 502);
      }
      const data = await res.json();
      const choice = data?.choices?.[0]?.message;
      const calls = choice?.tool_calls || [];
      if (!calls.length) return json({ reply: choice?.content || "I'm not sure how to help with that yet." });

      const propose = calls.find((c: any) => c?.function?.name === "propose_change");
      if (propose) {
        let args: ChangeSet = {};
        try { args = JSON.parse(propose.function.arguments || "{}"); } catch { /* ignore */ }
        const invalid = validate(args);
        if (invalid) return json({ reply: invalid });
        if (!hasChanges(args)) return json({ reply: args.summary || "I couldn't work out what to change — could you rephrase?" });
        return json({ reply: args.summary || "Here's what I'll change.", change_set: args });
      }

      messages.push({ role: "assistant", content: choice.content || "", tool_calls: calls });
      for (const c of calls) {
        let args: any = {};
        try { args = JSON.parse(c.function?.arguments || "{}"); } catch { /* ignore */ }
        const result = await runTool(c.function?.name, args);
        messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result).slice(0, 30000) });
      }
    }
    return json({ reply: "That took too many steps — could you ask a bit more specifically?" });
  } catch (e) {
    console.error("business-assistant error", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
