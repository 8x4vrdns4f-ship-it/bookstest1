export type Tier = "silver" | "gold" | "platinum";

export interface TierConfig {
  name: string;
  bookingsPerMonth: number | null; // null = unlimited
  staff: number | null;
  services: number | null;
  resources: number | null; // 0 = feature not available
  feePercent: number;
  retentionMonths: number | null;
  supportLabel: string;
  // Feature flags
  customBranding: boolean;
  advancedAnalytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  reviews: boolean;
  waitlist: boolean;
  smsReminders: boolean;
  dayMode: boolean;
  csvExport: boolean;
  giftCodes: boolean;
  removeBranding: boolean;
  campaigns: boolean;
  promoCodes: boolean;
  promoCodesMax: number; // 0 = feature not available
}

export const TIER_LIMITS: Record<Tier, TierConfig> = {
  silver: {
    name: "Silver",
    bookingsPerMonth: 100,
    staff: 2,
    services: 5,
    resources: 0,
    feePercent: 12.5,
    retentionMonths: 6,
    supportLabel: "Email support",
    customBranding: false,
    advancedAnalytics: false,
    apiAccess: false,
    prioritySupport: false,
    reviews: false,
    waitlist: false,
    smsReminders: false,
    dayMode: false,
    csvExport: false,
    giftCodes: false,
    removeBranding: false,
    campaigns: false,
    promoCodes: false,
    promoCodesMax: 0,
  },
  gold: {
    name: "Gold",
    bookingsPerMonth: 500,
    staff: 10,
    services: null,
    resources: 10,
    feePercent: 5,
    retentionMonths: 24,
    supportLabel: "Priority support (24h)",
    customBranding: true,
    advancedAnalytics: true,
    apiAccess: false,
    prioritySupport: true,
    reviews: true,
    waitlist: true,
    smsReminders: true,
    dayMode: true,
    csvExport: false,
    giftCodes: false,
    removeBranding: false,
    campaigns: true,
    promoCodes: true,
    promoCodesMax: 1,
  },
  platinum: {
    name: "Platinum",
    bookingsPerMonth: null,
    staff: null,
    services: null,
    resources: null,
    feePercent: 2,
    retentionMonths: null,
    supportLabel: "Priority support (1h)",
    customBranding: true,
    advancedAnalytics: true,
    apiAccess: true,
    prioritySupport: true,
    reviews: true,
    waitlist: true,
    smsReminders: true,
    dayMode: true,
    csvExport: true,
    giftCodes: true,
    removeBranding: true,
    campaigns: true,
    promoCodes: true,
    promoCodesMax: 2,
  },
};

export type TierFeature =
  | "customBranding"
  | "advancedAnalytics"
  | "apiAccess"
  | "prioritySupport"
  | "reviews"
  | "waitlist"
  | "smsReminders"
  | "dayMode"
  | "csvExport"
  | "giftCodes"
  | "removeBranding"
  | "campaigns"
  | "promoCodes";

export const FEATURE_LABELS: Record<TierFeature, string> = {
  customBranding: "Custom branding",
  advancedAnalytics: "Advanced analytics",
  apiAccess: "API & integrations",
  prioritySupport: "Priority support",
  reviews: "Reviews & ratings",
  waitlist: "Waitlist",
  smsReminders: "SMS reminders",
  dayMode: "Day & rental bookings",
  csvExport: "CSV export",
  giftCodes: "Gift codes",
  removeBranding: 'Remove "Powered by BookSuite"',
  campaigns: "Email campaigns",
  promoCodes: "Promo codes",
};

const TIER_ORDER: Tier[] = ["silver", "gold", "platinum"];

/** Does this tier (null = no subscription) include the given feature? */
export const tierAllows = (tier: Tier | null, feature: TierFeature): boolean =>
  tier ? TIER_LIMITS[tier][feature] : false;

/** Lowest tier that includes the given feature. */
export const requiredTierFor = (feature: TierFeature): Tier =>
  TIER_ORDER.find((t) => TIER_LIMITS[t][feature]) ?? "platinum";

/** Can this tier use resources at all (non-zero allowance)? */
export const tierAllowsResources = (tier: Tier | null): boolean =>
  tier ? TIER_LIMITS[tier].resources !== 0 : false;

export const nextTier = (t: Tier | null): Tier => {
  if (t === "silver") return "gold";
  if (t === "gold") return "platinum";
  return "gold";
};

/** The most valuable feature the current tier is missing, for upgrade nudges. */
export const topLockedFeature = (tier: Tier | null): TierFeature | null => {
  const order: TierFeature[] = [
    "reviews",
    "waitlist",
    "customBranding",
    "advancedAnalytics",
    "smsReminders",
    "dayMode",
    "csvExport",
    "apiAccess",
    "giftCodes",
    "removeBranding",
  ];
  return order.find((f) => !tierAllows(tier, f)) ?? null;
};
