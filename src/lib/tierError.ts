import { toast } from "@/hooks/use-toast";

/**
 * Detects our DB tier-limit / no-subscription errors and shows a friendly toast.
 * Returns true if the error was a tier error (so callers can skip generic handling).
 */
export function handleTierError(error: { message?: string } | null | undefined): boolean {
  const msg = error?.message || "";
  if (msg.includes("NO_SUBSCRIPTION")) {
    toast({
      title: "Subscription required",
      description: "You need an active plan to do this. Visit Pricing to subscribe.",
      variant: "destructive",
    });
    return true;
  }
  if (msg.includes("TIER_LIMIT_BOOKINGS")) {
    toast({
      title: "Monthly booking limit reached",
      description: "You've hit your plan's bookings cap for this month. Upgrade to add more.",
      variant: "destructive",
    });
    return true;
  }
  if (msg.includes("TIER_LIMIT_STAFF")) {
    toast({
      title: "Staff limit reached",
      description: "Your plan doesn't allow more staff. Upgrade to add more.",
      variant: "destructive",
    });
    return true;
  }
  if (msg.includes("TIER_LIMIT_SERVICES")) {
    toast({
      title: "Service limit reached",
      description: "Your plan's service menu is full. Upgrade to Gold for unlimited services.",
      variant: "destructive",
    });
    return true;
  }
  if (msg.includes("TIER_LIMIT_RESOURCES")) {
    toast({
      title: "Resource limit reached",
      description: "Bookable resources are available on Gold (up to 10) and Platinum (unlimited).",
      variant: "destructive",
    });
    return true;
  }
  if (msg.includes("TIER_LIMIT_GIFT_CODES")) {
    toast({
      title: "Monthly gift code limit reached",
      description: "You can create up to 5 gift codes per month. Try again next month.",
      variant: "destructive",
    });
    return true;
  }
  return false;
}
