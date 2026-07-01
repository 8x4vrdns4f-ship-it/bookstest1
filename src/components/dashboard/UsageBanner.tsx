import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertTriangle, TrendingUp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS, nextTier } from "@/lib/tierLimits";
import StaffMembersDialog from "./StaffMembersDialog";
import SectionCard from "@/components/app/SectionCard";

interface UsageBannerProps {
  userId: string;
}

const UsageBanner = ({ userId }: UsageBannerProps) => {
  const { tier, loading } = useSubscription();
  const [bookings, setBookings] = useState(0);
  const [staff, setStaff] = useState(0);
  const [staffOpen, setStaffOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [b, s] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true })
          .eq("user_id", userId).gte("created_at", monthStart.toISOString()),
        supabase.from("employees").select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      setBookings(b.count ?? 0);
      setStaff(s.count ?? 0);
    };
    load();
  }, [userId]);

  if (loading || !tier) return null;
  const limits = TIER_LIMITS[tier];
  const next = nextTier(tier);

  const bPct = limits.bookingsPerMonth ? Math.min(100, (bookings / limits.bookingsPerMonth) * 100) : 0;
  const sPct = limits.staff ? Math.min(100, (staff / limits.staff) * 100) : 0;
  const nearBookings = limits.bookingsPerMonth !== null && bookings / limits.bookingsPerMonth >= 0.8;
  const nearStaff = limits.staff !== null && staff / limits.staff >= 0.8;
  const showUpgrade = tier !== "platinum" && (nearBookings || nearStaff);

  return (
    <>
      <SectionCard
        className="mb-8"
        icon={<TrendingUp size={18} />}
        title="This month's usage"
        description={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles size={12} /> {limits.name} plan
          </span>
        }
        actions={
          showUpgrade ? (
            <Button asChild size="sm" variant="premium">
              <Link to="/pricing">
                <AlertTriangle size={14} />
                Upgrade to {TIER_LIMITS[next].name}
              </Link>
            </Button>
          ) : tier !== "platinum" ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/pricing">Upgrade</Link>
            </Button>
          ) : null
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Bookings this month</span>
              <span className="text-foreground font-medium">
                {bookings} / {limits.bookingsPerMonth ?? "∞"}
              </span>
            </div>
            {limits.bookingsPerMonth !== null && <Progress value={bPct} className="h-2" />}
          </div>
          <button
            type="button"
            onClick={() => setStaffOpen(true)}
            className="text-left rounded-md -m-1 p-1 hover:bg-secondary/40 transition-colors cursor-pointer"
            aria-label="View staff members"
          >
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground underline-offset-2 hover:underline">Staff members</span>
              <span className="text-foreground font-medium">
                {staff} / {limits.staff ?? "∞"}
              </span>
            </div>
            {limits.staff !== null && <Progress value={sPct} className="h-2" />}
          </button>
        </div>
      </SectionCard>
      <StaffMembersDialog
        open={staffOpen}
        onOpenChange={setStaffOpen}
        userId={userId}
        tierName={limits.name}
        limit={limits.staff}
        count={staff}
      />
    </>
  );
};

export default UsageBanner;
