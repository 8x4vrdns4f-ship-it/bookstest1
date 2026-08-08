import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_clients",
  title: "List clients",
  description: "List the signed-in business's saved clients, optionally filtered by a name or email search.",
  inputSchema: {
    search: z.string().describe("Case-insensitive text to match against name or email.").optional(),
    limit: z.number().int().describe("Maximum rows to return (default 50, max 200).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("clients")
      .select("id, name, email, phone, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));

    if (search) {
      const term = search.replace(/[%,]/g, " ").trim();
      if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { clients: data ?? [] },
    };
  },
});
