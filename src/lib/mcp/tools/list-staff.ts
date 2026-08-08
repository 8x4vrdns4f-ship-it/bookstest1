import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_staff",
  title: "List staff",
  description: "List the signed-in business's team members and their availability status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, email, position, available_now, manual_status, auth_user_id, created_at")
      .order("created_at", { ascending: true });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const staff = (data ?? []).map((e) => ({ ...e, invite_pending: !e.auth_user_id }));
    return {
      content: [{ type: "text", text: JSON.stringify(staff) }],
      structuredContent: { staff },
    };
  },
});
