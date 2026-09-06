// Natural-language settings assistant for business owners.
// Two phases:
//  1) { message, history } -> asks Lovable AI to propose a change set (no writes)
//  2) { apply: true, change_set } -> validates and applies the change set
// All writes run with the caller's JWT so RLS + tier-limit triggers apply.
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
  summary?: string;
};

const TIME_RE = /^([01]\d|2[0-3]|24):[0-5]\d$/;

function validate(cs: ChangeSet): string | null {
  const patch = cs.settings_patch || {};
  for (const k of Object.keys(patch)) {
    if (!SETTINGS_FIELDS.includes(k)) return `I can't change "${k}" from here.`;
  }
  if (patch.deposit_amount != null && Number(patch.deposit_amount) < 10) {
    return "The deposit has to be at least £10.";
  }
  if (patch.accent_color != null && !/^#[0-9a-fA-F]{6}$/.test(String(patch.accent_color))) {
    return "That colour doesn't look like a valid hex colour.";
  }
  if (patch.assignment_mode != null && !["client_pick", "auto"].includes(String(patch.assignment_mode))) {
    return "Assignment must be either letting customers pick or automatic.";
  }
  if (patch.payment_mode != null && !["deposit", "full", "none"].includes(String(patch.payment_mode))) {
    return "Payment mode must be deposit, full or none.";
  }
  if (patch.working_hours) {
    const wh: any = patch.working_hours;
    for (const d of DAY_KEYS) {
      const day = wh[d];
      if (!day) return "The opening hours need every day of the week.";
      if (typeof day.closed !== "boolean") return "Each day needs to say whether you're closed.";
      if (!TIME_RE.test(String(day.open)) || !TIME_RE.test(String(day.close))) {
        return "Opening and closing times must look like 09:00.";
      }
      if (!day.closed && String(day.close) <= String(day.open)) {
        return "Closing time has to be after opening time.";
      }
    }
  }
  for (const n of ["buffer_minutes", "max_advance_days", "cancellation_hours", "pending_request_ttl_hours", "rebooking_reminder_days"]) {
    if (patch[n] != null && (!Number.isFinite(Number(patch[n])) || Number(patch[n]) < 0)) {
      return `"${n.replace(/_/g, " ")}" must be zero or more.`;
    }
  }
  for (const op of cs.resource_ops || []) {
    if (!["create", "update", "delete"].includes(op.action)) return "Unsupported resource change.";
    if (op.action !== "create" && !op.id) return "Missing which resource to change.";
    if (op.action === "create" && !String(op.name || "").trim()) return "New resources need a name.";
    if (op.capacity != null && (!Number.isFinite(Number(op.capacity)) || Number(op.capacity) < 1)) {
      return "Capacity must be at least 1.";
    }
  }
  for (const op of cs.service_ops || []) {
    if (!["create", "update", "delete"].includes(op.action)) return "Unsupported service change.";
    if (op.action !== "create" && !op.id) return "Missing which service to change.";
    if (op.action === "create" && !String(op.name || "").trim()) return "New services need a name.";
    if (op.duration_minutes != null && (!Number.isFinite(Number(op.duration_minutes)) || Number(op.duration_minutes) < 5)) {
      return "Services must be at least 5 minutes long.";
    }
    if (op.price != null && op.price !== "" && (!Number.isFinite(Number(op.price)) || Number(op.price) < 0)) {
      return "Price can't be negative.";
    }
  }
  return null;
}

const CHANGE_TOOL = {
  type: "function",
  function: {
    name: "propose_settings_change",
    description:
      "Propose a change to the business's settings, bookable resources or services. Only include fields that should change.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Short plain-English summary of every change, for the owner to confirm." },
        settings_patch: {
          type: "object",
          description: "Partial business_settings row. Only changed fields. working_hours must contain all 7 day keys (mon..sun) with open, close, closed.",
          additionalProperties: true,
        },
        resource_ops: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["create", "update", "delete"] },
              id: { type: "string" },
              name: { type: "string" },
              capacity: { type: "number" },
              active: { type: "boolean" },
            },
            required: ["action"],
          },
        },
        service_ops: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["create", "update", "delete"] },
              id: { type: "string" },
              name: { type: "string" },
              duration_minutes: { type: "number" },
              price: { type: "number" },
              active: { type: "boolean" },
            },
            required: ["action"],
          },
        },
      },
      required: ["summary"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // Owners only — employees have their own dashboard.
    const { data: emp } = await userClient
      .from("employees").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (emp) return json({ error: "Only the business owner can change settings." }, 403);

    const body = await req.json().catch(() => ({}));

    // ---------- Phase 2: apply ----------
    if (body?.apply) {
      const cs: ChangeSet = body.change_set || {};
      const invalid = validate(cs);
      if (invalid) return json({ error: invalid }, 400);

      const applied: string[] = [];

      if (cs.settings_patch && Object.keys(cs.settings_patch).length) {
        const { error } = await userClient
          .from("business_settings")
          .upsert({ user_id: user.id, ...cs.settings_patch }, { onConflict: "user_id" });
        if (error) return json({ error: error.message }, 400);
        applied.push("settings");
      }

      for (const op of cs.resource_ops || []) {
        if (op.action === "create") {
          const { error } = await userClient.from("resources").insert({
            user_id: user.id,
            name: String(op.name).trim(),
            capacity: Math.max(1, Math.floor(Number(op.capacity ?? 1))),
            active: op.active ?? true,
          });
          if (error) return json({ error: error.message }, 400);
        } else if (op.action === "update") {
          const patch: Record<string, unknown> = {};
          if (op.name != null) patch.name = String(op.name).trim();
          if (op.capacity != null) patch.capacity = Math.max(1, Math.floor(Number(op.capacity)));
          if (op.active != null) patch.active = !!op.active;
          const { error } = await userClient.from("resources").update(patch).eq("id", op.id).eq("user_id", user.id);
          if (error) return json({ error: error.message }, 400);
        } else {
          const { error } = await userClient.from("resources").delete().eq("id", op.id).eq("user_id", user.id);
          if (error) return json({ error: error.message }, 400);
        }
        applied.push("resources");
      }

      for (const op of cs.service_ops || []) {
        if (op.action === "create") {
          const { error } = await userClient.from("services").insert({
            user_id: user.id,
            name: String(op.name).trim(),
            duration_minutes: Math.max(5, Math.floor(Number(op.duration_minutes ?? 30))),
            price: op.price == null || op.price === "" ? null : Number(op.price),
            active: op.active ?? true,
          });
          if (error) return json({ error: error.message }, 400);
        } else if (op.action === "update") {
          const patch: Record<string, unknown> = {};
          if (op.name != null) patch.name = String(op.name).trim();
          if (op.duration_minutes != null) patch.duration_minutes = Math.max(5, Math.floor(Number(op.duration_minutes)));
          if (op.price !== undefined) patch.price = op.price == null || op.price === "" ? null : Number(op.price);
          if (op.active != null) patch.active = !!op.active;
          const { error } = await userClient.from("services").update(patch).eq("id", op.id).eq("user_id", user.id);
          if (error) return json({ error: error.message }, 400);
        } else {
          const { error } = await userClient.from("services").delete().eq("id", op.id).eq("user_id", user.id);
          if (error) return json({ error: error.message }, 400);
        }
        applied.push("services");
      }

      return json({ applied: Array.from(new Set(applied)) });
    }

    // ---------- Phase 1: propose ----------
    const message = String(body?.message || "").trim();
    if (!message) return json({ error: "Type what you'd like to change." }, 400);
    if (message.length > 2000) return json({ error: "That message is a bit long — try shortening it." }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "The assistant isn't configured yet." }, 500);

    const [{ data: settings }, { data: resources }, { data: services }] = await Promise.all([
      userClient.from("business_settings").select("*").eq("user_id", user.id).maybeSingle(),
      userClient.from("resources").select("id, name, capacity, active").eq("user_id", user.id).order("sort_order"),
      userClient.from("services").select("id, name, duration_minutes, price, active").eq("user_id", user.id).order("sort_order"),
    ]);

    const context = {
      settings: settings
        ? Object.fromEntries(Object.entries(settings).filter(([k]) => SETTINGS_FIELDS.includes(k)))
        : {},
      resources: resources || [],
      services: services || [],
    };

    const system = `You are the settings assistant inside BookSuite, a booking platform. You help a business owner change their own settings by talking normally.

You can change: ${SETTINGS_FIELDS.join(", ")} on their settings row, plus create/update/delete bookable resources (tables, rooms, chairs) and services.

Rules:
- When the owner asks for a change, call the propose_settings_change tool. Never claim a change is done — the owner still has to confirm it.
- Only include fields that actually change. For working_hours you MUST return all seven keys mon,tue,wed,thu,fri,sat,sun, each { open: "HH:MM", close: "HH:MM", closed: boolean }, starting from their current hours and applying only what they asked.
- To edit or delete an existing resource/service, use its exact id from the context below.
- Deposits must be at least 10. Services are at least 5 minutes. Capacity is at least 1.
- If they ask about staff, roles, promo codes, billing, deleting their account or their password, reply in text that those are handled elsewhere in the app, and do not call the tool.
- If they just ask a question about their setup, answer it in one or two short sentences without calling the tool.
- Write in plain, friendly English. No jargon, no field names.

Their current setup (JSON):
${JSON.stringify(context)}`;

    const history = Array.isArray(body?.history)
      ? body.history.slice(-8).filter((m: any) => m && typeof m.content === "string" && ["user", "assistant"].includes(m.role))
      : [];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }],
        tools: [CHANGE_TOOL],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      if (res.status === 429) return json({ error: "The assistant is busy right now — try again in a moment." }, 429);
      if (res.status === 402) return json({ error: "The assistant is out of credit. Please top up to keep using it." }, 402);
      return json({ error: "The assistant couldn't answer just now." }, 502);
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;
    const call = choice?.tool_calls?.[0];

    if (call?.function?.name === "propose_settings_change") {
      let args: ChangeSet = {};
      try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }
      const invalid = validate(args);
      if (invalid) return json({ reply: invalid });
      const hasChanges =
        (args.settings_patch && Object.keys(args.settings_patch).length > 0) ||
        (args.resource_ops || []).length > 0 ||
        (args.service_ops || []).length > 0;
      if (!hasChanges) return json({ reply: args.summary || "I couldn't work out what to change — could you rephrase?" });
      return json({ reply: args.summary || "Here's what I'll change.", change_set: args });
    }

    return json({ reply: choice?.content || "I'm not sure how to help with that yet." });
  } catch (e) {
    console.error("settings-assistant error", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
