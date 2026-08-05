// Fire-and-forget platform alerts to the BookSuite owner.
// Never throws — an alert failure must never break a signup, payment or booking.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export const ADMIN_ALERT_FALLBACK = "help@booksuite.online";

export function adminAlertEmail(): string {
  return (Deno.env.get("ADMIN_ALERT_EMAIL") || ADMIN_ALERT_FALLBACK).trim();
}

export function formatWhen(d: Date = new Date()): string {
  try {
    return d.toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
    });
  } catch { return d.toISOString(); }
}

export function money(amount: number | null | undefined, currency = "GBP"): string {
  const n = Number(amount ?? 0);
  return `${String(currency || "GBP").toUpperCase()} ${n.toFixed(2)}`;
}

export interface AdminAlert {
  eventTitle: string;
  eventSummary?: string;
  businessName?: string;
  rows?: Array<{ label: string; value: string }>;
  /** Stable key derived from the source record so retries never double-send. */
  idempotencyKey: string;
}

export async function notifyAdmin(admin: SupabaseClient, alert: AdminAlert): Promise<void> {
  try {
    const to = adminAlertEmail();
    if (!to) return;
    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "platform-alert",
        recipientEmail: to,
        idempotencyKey: `admin-${alert.idempotencyKey}`,
        templateData: {
          eventTitle: alert.eventTitle,
          eventSummary: alert.eventSummary ?? "",
          businessName: alert.businessName ?? "",
          rows: alert.rows ?? [],
          occurredAt: formatWhen(),
        },
      },
    });
  } catch (e) {
    console.error("notifyAdmin failed", e);
  }
}
