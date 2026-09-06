// Availability computation for the customer portal reschedule flow.
// Mirrors the rules used by the public booking widget: working hours, date
// overrides, buffer minutes, same-day rules, advance window and existing bookings.
import { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const STEP = 30;

export interface DayHours { closed: boolean; open: string; close: string }

export function toMin(t: string): number {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fmtMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface AvailabilityContext {
  settings: any;
  overrides: Record<string, any>;
  busy: any[];
}

export async function loadAvailability(
  admin: SupabaseClient,
  userId: string,
  from: string,
  to: string,
): Promise<AvailabilityContext> {
  const [{ data: ws }, { data: ovs }, { data: busy }] = await Promise.all([
    admin.rpc("get_widget_settings", { p_user_id: userId }),
    admin.rpc("get_widget_date_overrides", { p_user_id: userId, p_from: from, p_to: to }),
    admin.rpc("get_busy_slots", { p_user_id: userId, p_from: from, p_to: to }),
  ]);
  const overrides: Record<string, any> = {};
  for (const o of (ovs as any[]) ?? []) overrides[o.override_date] = o;
  return {
    settings: (ws as any[])?.[0] ?? {},
    overrides,
    busy: (busy as any[]) ?? [],
  };
}

export function dayHours(ctx: AvailabilityContext, dateStr: string): DayHours {
  const ov = ctx.overrides[dateStr];
  if (ov) {
    if (ov.closed) return { closed: true, open: "09:00", close: "18:00" };
    return {
      closed: false,
      open: (ov.open_time || "09:00").slice(0, 5),
      close: (ov.close_time || "18:00").slice(0, 5),
    };
  }
  const key = DAY_KEYS[new Date(`${dateStr}T00:00:00`).getDay()];
  const wh = ctx.settings.working_hours || {};
  const day = wh[key];
  if (!day) return { closed: true, open: "09:00", close: "18:00" };
  return {
    closed: !!day.closed,
    open: (day.open || "09:00").slice(0, 5),
    close: (day.close || "18:00").slice(0, 5),
  };
}

/** Free start times (HH:MM) on a date, ignoring the booking being moved. */
export function availableSlots(
  ctx: AvailabilityContext,
  dateStr: string,
  durationMinutes: number,
  ignoreBookingKey?: { date: string; time: string } | null,
): string[] {
  const hrs = dayHours(ctx, dateStr);
  if (hrs.closed) return [];

  const buffer = Number(ctx.settings.buffer_minutes ?? 0) || 0;
  const now = new Date();
  const todayStr = fmtDate(now);
  const cutoff = dateStr === todayStr ? now.getHours() * 60 + now.getMinutes() : -1;

  const blocked = new Set<number>();
  for (const b of ctx.busy) {
    if (b.booking_date !== dateStr) continue;
    if (
      ignoreBookingKey &&
      b.booking_date === ignoreBookingKey.date &&
      (b.booking_time || "").slice(0, 5) === ignoreBookingKey.time.slice(0, 5)
    ) continue;
    const s = toMin((b.booking_time || "00:00").slice(0, 5)) - buffer;
    const e = toMin((b.booking_time || "00:00").slice(0, 5)) + (b.duration_minutes || 30) + buffer;
    for (let m = Math.max(0, Math.floor(s / STEP) * STEP); m < e; m += STEP) blocked.add(m);
  }

  const startM = toMin(hrs.open);
  const endM = toMin(hrs.close);
  const dur = Math.max(STEP, durationMinutes || 30);
  const out: string[] = [];
  for (let m = startM; m + dur <= endM; m += STEP) {
    if (cutoff >= 0 && m < cutoff) continue;
    let ok = true;
    for (let k = m; k < m + dur; k += STEP) if (blocked.has(k)) { ok = false; break; }
    if (ok) out.push(fmtMin(m));
  }
  return out;
}

/** Dates the customer may choose, respecting same-day and advance window rules. */
export function bookableDateRange(settings: any): { from: string; to: string } {
  const start = new Date();
  if (settings.allow_same_day === false) start.setDate(start.getDate() + 1);
  const maxDays = Math.min(Number(settings.max_advance_days ?? 14) || 14, 90);
  const end = new Date();
  end.setDate(end.getDate() + maxDays);
  return { from: fmtDate(start), to: fmtDate(end) };
}
