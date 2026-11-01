// Flat booking fee per paid booking, capped per calendar month (UK time).
// The rules live in ./booking-fee-rules.ts (unit-tested) and in the database
// (reserve_booking_fee & friends), which does the atomic counting.
import { bookingFeeTerms } from "./booking-fee-rules.ts";

type Admin = { from: (t: string) => any; rpc: (fn: string, args: any) => any };

/** Expected fee for display/estimates only (no cap reservation). */
export async function expectedBookingFeeMinor(admin: Admin, userId: string): Promise<number> {
  const { data } = await admin
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .eq("subscribed", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return bookingFeeTerms(data?.tier ?? null, data?.status ?? null).feeMinor;
}

/**
 * Atomically reserve this booking's fee against the business's monthly cap.
 * Returns the fee in pence (30p, the cap remainder, or 0). Call once per
 * booking before charging; confirm on success, release on failure.
 */
export async function reserveBookingFee(
  admin: Admin,
  opts: { userId: string; environment: string; bookingRef: string; chargeMinor: number },
): Promise<number> {
  const { data, error } = await admin.rpc("reserve_booking_fee", {
    _user_id: opts.userId,
    _environment: opts.environment,
    _booking_ref: opts.bookingRef,
    _charge_minor: opts.chargeMinor,
  });
  if (error) throw new Error(`Could not work out the booking fee: ${error.message}`);
  return Math.max(0, Number(data) || 0);
}

export async function confirmBookingFee(admin: Admin, bookingRef: string): Promise<void> {
  const { error } = await admin.rpc("confirm_booking_fee", { _booking_ref: bookingRef });
  if (error) console.error("confirm_booking_fee failed", bookingRef, error);
}

export async function releaseBookingFee(admin: Admin, bookingRef: string): Promise<void> {
  const { error } = await admin.rpc("release_booking_fee", { _booking_ref: bookingRef });
  if (error) console.error("release_booking_fee failed", bookingRef, error);
}
