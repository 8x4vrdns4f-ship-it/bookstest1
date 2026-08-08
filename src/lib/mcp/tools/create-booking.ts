import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_booking",
  title: "Create booking",
  description:
    "Create a new booking for the signed-in business. Times use 24h HH:MM and dates use YYYY-MM-DD.",
  inputSchema: {
    client_name: z.string().describe("Customer name."),
    booking_date: z.string().describe("Booking date, YYYY-MM-DD."),
    booking_time: z.string().describe("Booking start time, 24h HH:MM."),
    service: z.string().describe("Service name for this booking."),
    duration_minutes: z.number().int().describe("Duration in minutes (default 30).").optional(),
    client_email: z.string().describe("Customer email address.").optional(),
    notes: z.string().describe("Internal notes for this booking.").optional(),
    party_size: z.number().int().describe("Number of people, for table/group bookings.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: ctx.getUserId(),
        client_name: input.client_name,
        client_email: input.client_email ?? null,
        booking_date: input.booking_date,
        booking_time: input.booking_time,
        service: input.service,
        duration_minutes: input.duration_minutes ?? 30,
        notes: input.notes ?? null,
        party_size: input.party_size ?? null,
        status: "confirmed",
      })
      .select("id, booking_date, booking_time, client_name, service, status");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { booking: data?.[0] ?? null },
    };
  },
});
