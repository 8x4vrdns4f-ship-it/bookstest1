import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBookingsTool from "./tools/list-bookings";
import createBookingTool from "./tools/create-booking";
import updateBookingStatusTool from "./tools/update-booking-status";
import listClientsTool from "./tools/list-clients";
import listServicesTool from "./tools/list-services";
import listStaffTool from "./tools/list-staff";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "booksuite-your-all-in-one-solution",
  title: "BookSuite: Your All-in-One Solution",
  version: "0.1.0",
  instructions:
    "Tools for BookSuite, a booking platform for service businesses. All tools act as the signed-in business owner or staff member. Use `list_bookings` to read the schedule, `create_booking` to add an appointment, `update_booking_status` to confirm or cancel one, and `list_clients`, `list_services`, and `list_staff` to read the business's customers, service menu, and team.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listBookingsTool,
    createBookingTool,
    updateBookingStatusTool,
    listClientsTool,
    listServicesTool,
    listStaffTool,
  ],
});
