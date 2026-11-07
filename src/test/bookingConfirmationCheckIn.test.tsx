import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookingsList from "@/components/dashboard/BookingsList";

const mocks = vi.hoisted(() => ({
  enabled: true,
  sendEmail: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(async () => ({ data: "ABC123", error: null })),
  toast: vi.fn(),
  updated: true,
  filters: vi.fn(),
}));

vi.mock("@/lib/sendEmail", () => ({
  sendEmail: mocks.sendEmail,
  formatDate: (value: string) => value,
  formatTime: (value: string) => value.slice(0, 5),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/components/dashboard/BookingDetailDialog", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: vi.fn(),
  },
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.updated = true; });

function setupBookings() {
  mocks.from.mockImplementation((table: string) => {
    let updating = false;
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
    for (const method of ["select", "order", "gte", "limit"]) chain[method] = () => chain;
    chain.update = () => { updating = true; return chain; };
    chain.eq = (...args: unknown[]) => { if (updating) mocks.filters(...args); return chain; };
    chain.maybeSingle = async () => result;
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(
      updating ? { data: mocks.updated ? [{ id: "booking-1" }] : [], error: null } : result,
    ).then(resolve);
    return chain;
  });
}

describe("dashboard confirmation email check-in data", () => {
  it.each([true, false])("passes the current business switch (%s) and canonical kiosk URL on Accept", async (enabled) => {
    mocks.enabled = enabled;
    setupBookings();
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

  it("generates one code for a double click and requires pending status", async () => {
    setupBookings();
    render(<BookingsList userId="owner-1" />);
    const accept = await screen.findByRole("button", { name: "Accept" });
    fireEvent.click(accept);
    fireEvent.click(accept);
    expect(screen.getByRole("button", { name: "Decline" })).toBeDisabled();
    await waitFor(() => expect(mocks.sendEmail).toHaveBeenCalledTimes(1));
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.filters).toHaveBeenCalledWith("status", "pending");
  });

  it("sends no email or success toast when the pending update affects no row", async () => {
    mocks.updated = false;
    setupBookings();
    render(<BookingsList userId="owner-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Accept" })).not.toBeDisabled());
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});