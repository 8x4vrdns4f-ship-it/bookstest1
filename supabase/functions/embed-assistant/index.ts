import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Tier = "silver" | "gold" | "platinum";

const TIER_LABEL: Record<Tier, string> = {
  silver: "Silver plan · 1 AI request per month",
  gold: "Gold plan · 1 AI request per week",
  platinum: "Platinum plan · 1 AI request per 24 hours",
};

function windowStart(tier: Tier): Date {
  const now = new Date();
  if (tier === "silver") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  if (tier === "gold") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

function nextAvailable(tier: Tier, lastUsedAt: Date): Date {
  if (tier === "silver") {
    const d = new Date(lastUsedAt);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  }
  if (tier === "gold") {
    return new Date(lastUsedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(lastUsedAt.getTime() + 24 * 60 * 60 * 1000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, request, origin } = await req.json();
    if (!userId || !request) {
      return new Response(JSON.stringify({ error: "Missing userId or request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Resolve active tier
    const { data: tierRow, error: tierErr } = await supabase.rpc("get_active_tier", {
      _user_id: userId,
    });
    if (tierErr) {
      console.error("get_active_tier error", tierErr);
    }
    const tier = (tierRow as Tier | null) ?? null;

    if (!tier) {
      return new Response(
        JSON.stringify({
          error: "Subscribe to use the embed AI assistant.",
          code: "NO_SUBSCRIPTION",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Rate limit check
    const since = windowStart(tier);
    const { data: usageRows, error: usageErr } = await supabase
      .from("embed_assistant_usage")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (usageErr) {
      console.error("usage lookup error", usageErr);
    }

    if (usageRows && usageRows.length > 0) {
      const last = new Date(usageRows[0].created_at);
      const next = nextAvailable(tier, last);
      return new Response(
        JSON.stringify({
          error: `You've used your AI request for this period. Next available ${next.toUTCString()}.`,
          code: "RATE_LIMIT",
          tier,
          tier_label: TIER_LABEL[tier],
          next_available_at: next.toISOString(),
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const base = (origin && /^https?:\/\//.test(origin)) ? origin : "https://booksuite.online";

    const scriptSnippet = `<div id="booksuite-widget"></div>\n<script src="${base}/embed.js" data-user="${userId}"></script>`;
    const iframeSnippet = `<iframe src="${base}/embed/${userId}" style="border:none;width:100%;max-width:500px;height:760px" title="Book an appointment"></iframe>`;
    const linkSnippet = `${base}/book/${userId}`;

    const systemPrompt = `You are an embed-code assistant for BookSuite, a booking widget that businesses paste into their own websites.

You have three install methods available:

1) SCRIPT TAG (preferred, always live-updating):
${scriptSnippet}

2) IFRAME (use when the site builder blocks <script> tags, e.g. some Squarespace/Wix free tiers):
${iframeSnippet}

3) DIRECT LINK (a standalone booking page; good for "Book Now" buttons, Instagram bios, QR codes):
${linkSnippet}

Given the user's plain-English request, decide:
- Which method best fits.
- Where on their site it should go (header, hero, middle of homepage, dedicated /book page, footer button, etc.).
- The final HTML snippet they should paste, **customized for the requested placement** (e.g. wrap in a centered container with max-width, add margin, add an anchor id, add a heading, etc.). Only output valid copy-paste HTML — no React, no Tailwind classes.
- Step-by-step instructions for their site builder if they mentioned one (Wix, Squarespace, Shopify, WordPress, Webflow, plain HTML).

Always call the return_embed_instructions tool. Keep steps short, concrete, and numbered.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "return_embed_instructions",
          description: "Return tailored embed instructions for the user.",
          parameters: {
            type: "object",
            properties: {
              method: {
                type: "string",
                enum: ["script", "iframe", "link"],
                description: "Which install method was chosen.",
              },
              platform: {
                type: "string",
                description: "Detected site platform (Wix, Squarespace, Shopify, WordPress, Webflow, plain HTML, unknown).",
              },
              placement_summary: {
                type: "string",
                description: "One sentence describing where and how the widget will appear.",
              },
              snippet: {
                type: "string",
                description: "The exact HTML the user should paste, customized for the requested placement.",
              },
              steps: {
                type: "array",
                items: { type: "string" },
                description: "Numbered instructions for adding the snippet to their specific platform.",
              },
              notes: {
                type: "string",
                description: "Optional extra tips, caveats, or alternatives.",
              },
            },
            required: ["method", "platform", "placement_summary", "snippet", "steps"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_embed_instructions" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit hit. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return instructions" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(call.function.arguments);

    // 3. Record successful usage
    const { error: insertErr } = await supabase
      .from("embed_assistant_usage")
      .insert({ user_id: userId });
    if (insertErr) {
      console.error("usage insert error", insertErr);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("embed-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
