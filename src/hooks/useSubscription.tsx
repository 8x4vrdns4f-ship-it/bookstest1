import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tier } from "@/lib/tierLimits";

export interface SubscriptionState {
  loading: boolean;
  tier: Tier | null;
  isActive: boolean;
  isTrialing: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [isTrialing, setIsTrialing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Ask Stripe for the latest status (returns tier + status + trial info).
      const { data: fn } = await supabase.functions.invoke("check-subscription").catch(() => ({ data: null }));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTier(null); setCurrentPeriodEnd(null); setTrialEnd(null); setIsTrialing(false); return;
      }

      // Prefer the fresh response from the edge function; fall back to row.
      let resolvedTier: Tier | null = null;
      let resolvedEnd: string | null = null;
      let resolvedTrialEnd: string | null = null;
      let trialing = false;

      if (fn && (fn as any).subscribed) {
        resolvedTier = ((fn as any).tier as Tier) ?? null;
        resolvedEnd = (fn as any).current_period_end ?? null;
        resolvedTrialEnd = (fn as any).trial_end ?? null;
        trialing = (fn as any).status === "trialing";
      } else {
        const { data } = await supabase
          .from("subscriptions")
          .select("tier, subscribed, current_period_end, price_id, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const now = new Date();
        const hasUnexpiredWindow = !data?.current_period_end || new Date(data.current_period_end) > now;
        const isGiftBacked = typeof data?.price_id === "string" && data.price_id.startsWith("gift_");
        const stillValid = !!data?.tier && hasUnexpiredWindow && (data?.subscribed || data?.status === "active" || isGiftBacked);
        resolvedTier = stillValid && data?.tier ? (data.tier as Tier) : null;
        resolvedEnd = data?.current_period_end ?? null;
      }

      setTier(resolvedTier);
      setCurrentPeriodEnd(resolvedEnd);
      setTrialEnd(resolvedTrialEnd);
      setIsTrialing(trialing);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    loading,
    tier,
    isActive: tier !== null,
    isTrialing,
    trialEnd,
    currentPeriodEnd,
    refresh,
  };
}
