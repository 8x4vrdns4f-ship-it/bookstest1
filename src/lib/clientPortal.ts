import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "booksuite_portal_session";

export interface PortalBusiness {
  user_id?: string;
  business_name?: string | null;
  business_address?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  cancellation_hours?: number | null;
  currency?: string | null;
  accent_color?: string | null;
  booking_mode?: string | null;
}

export interface PortalBooking {
  id: string;
  user_id: string;
  service: string;
  booking_date: string;
  booking_time: string;
  end_date: string | null;
  rental_days: number | null;
  duration_minutes: number;
  party_size: number | null;
  client_name: string;
  status: string;
  notes: string | null;
  deposit_amount: number | null;
  charge_amount: number | null;
  service_price: number | null;
  payment_status: string;
  confirmation_code: string | null;
  review_token: string | null;
  review_submitted_at: string | null;
  created_at: string;
  business: PortalBusiness;
}

export const getPortalSession = (): { token: string; email: string } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; email?: string; expires_at?: string };
    if (!parsed.token || !parsed.email) return null;
    if (parsed.expires_at && new Date(parsed.expires_at) < new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { token: parsed.token, email: parsed.email };
  } catch {
    return null;
  }
};

export const setPortalSession = (token: string, email: string, expiresAt?: string) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, email, expires_at: expiresAt }));
};

export const clearPortalSession = () => localStorage.removeItem(STORAGE_KEY);

const call = async <T,>(fn: string, body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // Edge functions return details in the response body for non-2xx.
    const ctx = (error as unknown as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const parsed = await ctx.json();
        if (parsed?.error) throw new Error(parsed.error);
      } catch (e) {
        if (e instanceof Error && e.message) throw e;
      }
    }
    throw new Error("Something went wrong. Please try again.");
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
};

export const requestPortalLink = (email: string) =>
  call<{ ok: true }>("client-portal-request-link", { email, origin: window.location.origin });

export const verifyPortalLink = (token: string) =>
  call<{ ok: true; session_token: string; email: string; expires_at: string }>(
    "client-portal-verify", { token },
  );

export const fetchPortalBookings = (token: string) =>
  call<{ ok: true; email: string; profile: { name: string | null; phone: string | null }; bookings: PortalBooking[] }>(
    "client-portal-bookings", { session_token: token },
  );

export const fetchPortalSlots = (token: string, bookingId: string, date?: string) =>
  call<{ ok: true; open_days: string[]; slots: string[]; range: { from: string; to: string } }>(
    "client-portal-slots", { session_token: token, booking_id: bookingId, date },
  );

export const cancelPortalBooking = (token: string, bookingId: string) =>
  call<{ ok: true; refunded: boolean }>(
    "client-portal-update-booking", { session_token: token, booking_id: bookingId, action: "cancel" },
  );

export const reschedulePortalBooking = (
  token: string, bookingId: string, date: string, time: string,
) =>
  call<{ ok: true; booking_date: string; booking_time: string }>(
    "client-portal-update-booking",
    { session_token: token, booking_id: bookingId, action: "reschedule", date, time },
  );

export const updatePortalDetails = (token: string, name: string, phone: string) =>
  call<{ ok: true }>("client-portal-update-client", { session_token: token, name, phone });

export const currencySymbol = (code?: string | null) => {
  switch ((code || "GBP").toUpperCase()) {
    case "USD": return "$";
    case "EUR": return "€";
    case "JPY": return "¥";
    case "AUD": return "A$";
    case "CAD": return "C$";
    default: return "£";
  }
};

export const isPastBooking = (b: PortalBooking) => {
  const end = new Date(`${b.booking_date}T${b.booking_time}`);
  end.setMinutes(end.getMinutes() + (b.duration_minutes || 30));
  return end.getTime() < Date.now();
};

export const isClosedStatus = (status: string) =>
  ["cancelled_by_client", "cancelled", "completed", "no_show", "declined"].includes(status);

export const statusLabel = (status: string) => {
  switch (status) {
    case "cancelled_by_client": return "Cancelled by you";
    case "cancelled": return "Cancelled";
    case "confirmed": return "Confirmed";
    case "pending": return "Awaiting confirmation";
    case "completed": return "Completed";
    case "no_show": return "Missed";
    case "declined": return "Declined";
    default: return status.replace(/_/g, " ");
  }
};
