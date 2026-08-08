import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_booking_status",
  title: "Update booking status",
  description:
    "Change the status of one of the signed-in business's bookings (e.g. confirmed, cancelled, completed).",
  inputSchema: {
    booking_id: z.string().describe("The booking id to update."),
    status: z
      .string()
      .describe("New status: pending, confirmed, cancelled, completed, or no_show."),
    decline_reason: z.string().describe("Optional reason shown when cancelling.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ booking_id, status, decline_reason }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bookings")
      .update({ status, ...(decline_reason ? { decline_reason } : {}) })
      .eq("id", booking_id)
      .select("id, status, booking_date, booking_time, client_name");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) {
      return {
        content: [{ type: "text", text: "No booking found with that id for your account." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { booking: data[0] },
    };
  },
});
