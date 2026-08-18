import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tier } from "@/lib/tierLimits";

export interface SubscriptionState {
  loading: boolean;
  tier: Tier | null;
  isActive: boolean;
  isTrialing: boolean;
  isGift: boolean;
  priceId: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState | null>(null);

function useSubscriptionState(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [isTrialing, setIsTrialing] = useState(false);
  const [priceId, setPriceId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: fn } = await supabase.functions.invoke("check-subscription").catch(() => ({ data: null }));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTier(null); setCurrentPeriodEnd(null); setTrialEnd(null); setIsTrialing(false); setPriceId(null); return;
      }

      let resolvedTier: Tier | null = null;
      let resolvedEnd: string | null = null;
      let resolvedTrialEnd: string | null = null;
      let trialing = false;
      let resolvedPriceId: string | null = null;

      if (fn && (fn as any).subscribed) {
        resolvedTier = ((fn as any).tier as Tier) ?? null;
        resolvedEnd = (fn as any).current_period_end ?? null;
        resolvedTrialEnd = (fn as any).trial_end ?? null;
        trialing = (fn as any).status === "trialing";
        resolvedPriceId = (fn as any).price_id ?? null;
      }

      // Always check DB row for gift/priceId info (edge function may not report it).
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, subscribed, current_period_end, price_id, status, stripe_subscription_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!resolvedTier) {
        const now = new Date();
        const hasUnexpiredWindow = !data?.current_period_end || new Date(data.current_period_end) > now;
        const isGiftBacked = typeof data?.price_id === "string" && data.price_id.startsWith("gift_");
        const stillValid = !!data?.tier && hasUnexpiredWindow && (data?.subscribed || data?.status === "active" || isGiftBacked);
        resolvedTier = stillValid && data?.tier ? (data.tier as Tier) : null;
        resolvedEnd = data?.current_period_end ?? null;
      }
      if (!resolvedPriceId) resolvedPriceId = data?.price_id ?? null;

      setTier(resolvedTier);
      setCurrentPeriodEnd(resolvedEnd);
      setTrialEnd(resolvedTrialEnd);
      setIsTrialing(trialing);
      setPriceId(resolvedPriceId);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isGift = !!priceId && priceId.startsWith("gift_");

  return {
    loading,
    tier,
    isActive: tier !== null,
    isTrialing,
    isGift,
    priceId,
    trialEnd,
    currentPeriodEnd,
    refresh,
  };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const state = useSubscriptionState();
  return <SubscriptionContext.Provider value={state}>{children}</SubscriptionContext.Provider>;
}

/**
 * Shared subscription state. Reads from the provider when available so the
 * check-subscription call happens once per session instead of once per consumer.
 */
export function useSubscription(): SubscriptionState {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used inside <SubscriptionProvider>");
  }
  return ctx;
}
