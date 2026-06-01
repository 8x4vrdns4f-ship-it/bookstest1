import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tier } from "@/lib/tierLimits";

export interface SubscriptionState {
  loading: boolean;
  tier: Tier | null;
  isActive: boolean;
  currentPeriodEnd: string | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Ask Stripe for the latest status, then read the row.
      await supabase.functions.invoke("check-subscription").catch(() => {});
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTier(null); setCurrentPeriodEnd(null); return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, subscribed, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const stillValid = data?.subscribed && (!data.current_period_end || new Date(data.current_period_end) > new Date());
      setTier(stillValid && data?.tier ? (data.tier as Tier) : null);
      setCurrentPeriodEnd(data?.current_period_end ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    loading,
    tier,
    isActive: tier !== null,
    currentPeriodEnd,
    refresh,
  };
}
