export type Tier = "silver" | "gold" | "platinum";

export const TIER_LIMITS: Record<Tier, {
  name: string;
  bookingsPerMonth: number | null; // null = unlimited
  staff: number | null;
  customBranding: boolean;
  advancedAnalytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}> = {
  silver: {
    name: "Silver",
    bookingsPerMonth: 50,
    staff: 1,
    customBranding: false,
    advancedAnalytics: false,
    apiAccess: false,
    prioritySupport: false,
  },
  gold: {
    name: "Gold",
    bookingsPerMonth: 300,
    staff: 10,
    customBranding: true,
    advancedAnalytics: true,
    apiAccess: false,
    prioritySupport: true,
  },
  platinum: {
    name: "Platinum",
    bookingsPerMonth: null,
    staff: null,
    customBranding: true,
    advancedAnalytics: true,
    apiAccess: true,
    prioritySupport: true,
  },
};

export const nextTier = (t: Tier | null): Tier => {
  if (t === "silver") return "gold";
  if (t === "gold") return "platinum";
  return "gold";
};
