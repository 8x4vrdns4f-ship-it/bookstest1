// Business ledger ("tab"): what a business owes BookSuite for costs caused by
// its booking payments. Every write is idempotent on stripe_object_id.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export type LedgerType =
  | "stripe_fee_shortfall" | "refund_shortfall" | "unreversed_refund"
  | "dispute_amount" | "dispute_fee" | "dispute_won_credit" | "collected";

export async function addLedgerEntry(admin: SupabaseClient, e: {
  userId: string; bookingId?: string | null; type: LedgerType; amountMinor: number;
  currency: string; environment: string; stripeObjectId: string; note?: string;
}): Promise<void> {
  if (!e.amountMinor) return;
  const { error } = await admin.from("business_ledger").upsert({
    user_id: e.userId,
    booking_id: e.bookingId ?? null,
    type: e.type,
    amount_minor: Math.round(e.amountMinor),
    currency: (e.currency || "GBP").toUpperCase(),
    environment: e.environment === "sandbox" ? "sandbox" : "live",
    stripe_object_id: e.stripeObjectId,
    note: e.note ?? null,
  }, { onConflict: "stripe_object_id", ignoreDuplicates: true });
  if (error) console.error("ledger write failed", e.stripeObjectId, error);
}

export async function outstandingMinor(admin: SupabaseClient, userId: string, environment: string, currency: string): Promise<number> {
  const { data } = await admin.from("business_ledger_balances").select("balance_minor")
    .eq("user_id", userId).eq("environment", environment).eq("currency", currency.toUpperCase()).maybeSingle();
  return Math.max(0, Number(data?.balance_minor ?? 0));
}
