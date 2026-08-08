import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_bookings",
  title: "List bookings",
  description:
    "List the signed-in business's bookings, optionally filtered by date range and status.",
  inputSchema: {
    from: z.string().describe("Start date (YYYY-MM-DD), inclusive.").optional(),
    to: z.string().describe("End date (YYYY-MM-DD), inclusive.").optional(),
    status: z
      .string()
      .describe("Booking status filter, e.g. pending, confirmed, cancelled, completed.")
      .optional(),
    limit: z.number().int().describe("Maximum rows to return (default 50, max 200).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("bookings")
      .select(
        "id, booking_date, booking_time, duration_minutes, client_name, client_email, service, status, payment_status, service_price, party_size, notes, assigned_employee_id",
      )
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));

    if (from) query = query.gte("booking_date", from);
    if (to) query = query.lte("booking_date", to);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { bookings: data ?? [] },
    };
  },
});
