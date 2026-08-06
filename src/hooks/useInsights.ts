import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RangeKey = "7d" | "30d" | "90d" | "ytd";

export const RANGE_LABELS: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "This year",
};

export type BookingRow = {
  id: string;
  created_at: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  service: string | null;
  service_id: string | null;
  assigned_employee_id: string | null;
  resource_id: string | null;
  client_email: string | null;
  client_name: string | null;
  charge_amount: number | null;
  deposit_amount: number | null;
  service_price: number | null;
};

type Lookup = { id: string; name: string | null };

export type InsightsData = {
  loading: boolean;
  currency: string;
  resourcesEnabled: boolean;
  resourceLabel: string;
  bookings: BookingRow[];
  previousBookings: BookingRow[];
  services: Lookup[];
  employees: Lookup[];
  resources: Lookup[];
  ratingsByEmployee: Record<string, { total: number; count: number }>;
  from: Date;
  to: Date;
};

export function rangeBounds(range: RangeKey, now = new Date()) {
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  if (range === "7d") from.setDate(from.getDate() - 6);
  else if (range === "30d") from.setDate(from.getDate() - 29);
  else if (range === "90d") from.setDate(from.getDate() - 89);
  else from.setTime(new Date(now.getFullYear(), 0, 1).getTime());
  return { from, to };
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const BOOKING_COLS =
  "id, created_at, booking_date, booking_time, status, payment_status, service, service_id, assigned_employee_id, resource_id, client_email, client_name, charge_amount, deposit_amount, service_price";

export function useInsights(businessUserId: string | undefined, range: RangeKey): InsightsData {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [previousBookings, setPreviousBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<Lookup[]>([]);
  const [employees, setEmployees] = useState<Lookup[]>([]);
  const [resources, setResources] = useState<Lookup[]>([]);
  const [ratingsByEmployee, setRatings] = useState<Record<string, { total: number; count: number }>>({});
  const [currency, setCurrency] = useState("GBP");
  const [resourcesEnabled, setResourcesEnabled] = useState(false);
  const [resourceLabel, setResourceLabel] = useState("Resource");

  const { from, to } = useMemo(() => rangeBounds(range), [range]);

  useEffect(() => {
    if (!businessUserId) return;
    let active = true;
    (async () => {
      setLoading(true);
      const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
      const prevFrom = new Date(from);
      prevFrom.setDate(prevFrom.getDate() - spanDays);
      const prevTo = new Date(from);
      prevTo.setDate(prevTo.getDate() - 1);

      const [cur, prev, svc, emp, res, rev, settings] = await Promise.all([
        supabase
          .from("bookings")
          .select(BOOKING_COLS)
          .eq("user_id", businessUserId)
          .gte("booking_date", isoDate(from))
          .lte("booking_date", isoDate(to))
          .order("booking_date", { ascending: true }),
        supabase
          .from("bookings")
          .select(BOOKING_COLS)
          .eq("user_id", businessUserId)
          .gte("booking_date", isoDate(prevFrom))
          .lte("booking_date", isoDate(prevTo)),
        supabase.from("services").select("id, name").eq("user_id", businessUserId),
        supabase.from("employees").select("id, name").eq("user_id", businessUserId),
        supabase.from("resources").select("id, name").eq("user_id", businessUserId),
        supabase
          .from("reviews")
          .select("rating, bookings(assigned_employee_id)")
          .eq("user_id", businessUserId),
        supabase
          .from("business_settings")
          .select("currency, resources_enabled, resource_label")
          .eq("user_id", businessUserId)
          .maybeSingle(),
      ]);

      if (!active) return;
      setBookings((cur.data as BookingRow[]) ?? []);
      setPreviousBookings((prev.data as BookingRow[]) ?? []);
      setServices((svc.data as Lookup[]) ?? []);
      setEmployees((emp.data as Lookup[]) ?? []);
      setResources((res.data as Lookup[]) ?? []);

      const map: Record<string, { total: number; count: number }> = {};
      for (const r of (rev.data as any[]) ?? []) {
        const eid = r?.bookings?.assigned_employee_id;
        if (!eid) continue;
        if (!map[eid]) map[eid] = { total: 0, count: 0 };
        map[eid].total += Number(r.rating) || 0;
        map[eid].count += 1;
      }
      setRatings(map);

      setCurrency(settings.data?.currency || "GBP");
      setResourcesEnabled(Boolean(settings.data?.resources_enabled));
      setResourceLabel(settings.data?.resource_label || "Resource");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [businessUserId, from, to]);

  return {
    loading,
    currency,
    resourcesEnabled,
    resourceLabel,
    bookings,
    previousBookings,
    services,
    employees,
    resources,
    ratingsByEmployee,
    from,
    to,
  };
}

/** Money actually taken for a booking (deposit or full payment). */
export function bookingRevenue(b: BookingRow) {
  if (b.payment_status !== "paid" && b.payment_status !== "captured" && b.payment_status !== "succeeded") return 0;
  return Number(b.charge_amount ?? b.deposit_amount ?? 0) || 0;
}

export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}
