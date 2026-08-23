import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/connectPayments";

/**
 * True when the business can actually take money (and therefore bookings).
 * `null` while loading so callers can avoid flashing a warning.
 */
export function usePaymentsReady(userId: string | undefined) {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("connect_accounts")
      .select("charges_enabled")
      .eq("user_id", userId)
      .eq("environment", getStripeEnvironment())
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setReady(!!data?.charges_enabled);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return ready;
}
