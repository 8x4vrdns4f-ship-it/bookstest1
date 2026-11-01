import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { getStripeEnvironment } from "@/lib/connectPayments";
import { TIER_LIMITS, type Tier } from "@/lib/tierLimits";
import { londonMonthKey } from "../../../supabase/functions/_shared/booking-fee-rules";

const gbp = (minor: number) => `£${(minor / 100).toFixed(2)}`;

/** "Booking fees this month: £X of £25" — read from the server-side monthly counter. */
const BookingFeesThisMonth = ({ userId, tier, isTrialing }: { userId: string; tier: Tier | null; isTrialing: boolean }) => {
  const [usedMinor, setUsedMinor] = useState(0);
  // Trials (and no plan) use Silver's fee and cap.
  const terms = !tier || isTrialing ? TIER_LIMITS.silver : TIER_LIMITS[tier];

  useEffect(() => {
    const month = `${londonMonthKey(new Date())}-01`;
    supabase
      .from("booking_fee_months")
      .select("used_minor")
      .eq("user_id", userId)
      .eq("environment", getStripeEnvironment())
      .eq("month", month)
      .maybeSingle()
      .then(({ data }) => setUsedMinor(Number(data?.used_minor ?? 0)));
  }, [userId]);

  if (terms.bookingFeeCapMinor === 0) {
    return <p className="text-sm text-foreground font-medium">No booking fees</p>;
  }

  const cap = terms.bookingFeeCapMinor;
  const used = Math.min(usedMinor, cap);
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground font-medium">
        Booking fees this month: {gbp(used)} of {gbp(cap)}
      </p>
      <Progress value={(used / cap) * 100} className="h-2" aria-label="Booking fees used this month" />
    </div>
  );
};

export default BookingFeesThisMonth;
