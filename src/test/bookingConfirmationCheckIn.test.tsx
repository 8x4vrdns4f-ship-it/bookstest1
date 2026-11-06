import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookingsList from "@/components/dashboard/BookingsList";

const mocks = vi.hoisted(() => ({
  enabled: true,
  sendEmail: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(async () => ({ data: "ABC123", error: null })),
}));

vi.mock("@/lib/sendEmail", () => ({
  sendEmail: mocks.sendEmail,
  formatDate: (value: string) => value,
  formatTime: (value: string) => value.slice(0, 5),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/dashboard/BookingDetailDialog", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: vi.fn(),
  },
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("dashboard confirmation email check-in data", () => {
  it.each([true, false])("passes the current business switch (%s) and canonical kiosk URL on Accept", async (enabled) => {
    mocks.enabled = enabled;
    mocks.from.mockImplementation((table: string) => {
      const result = { data: table === "bookings" ? [{
        id: "booking-1", client_name: "Test Client", client_email: "client@example.com",
        service: "Haircut", booking_date: "2026-11-07", booking_time: "12:00:00",
        duration_minutes: 30, status: "pending", confirmation_code: null,
        assigned_employee_id: null, notes: null,
      }] : table === "business_settings" ? {
        business_name: "Test business", company_code: "BS-ABC999", currency: "GBP",
        self_checkin_enabled: mocks.enabled,
      } : [], error: null };
      const chain: Record<string, unknown> = {};
      for (const method of ["select", "eq", "order", "gte", "limit", "update"]) chain[method] = () => chain;
      chain.maybeSingle = async () => result;
      chain.then = (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve);
      return chain;
    });
    render(<BookingsList userId="owner-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(mocks.sendEmail).toHaveBeenCalledWith(
      "booking-confirmed", "client@example.com", "booking-confirm-booking-1",
      expect.objectContaining({
        confirmationCode: "ABC123", selfCheckIn: enabled,
        checkInUrl: "https://booksuite.online/kiosk/BS-ABC999?code=ABC123",
      }), "owner-1",
    ));
  });
});