import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS, nextTier } from "@/lib/tierLimits";

interface UsageBannerProps {
  userId: string;
}

const UsageBanner = ({ userId }: UsageBannerProps) => {
  const { tier, loading } = useSubscription();
  const [bookings, setBookings] = useState(0);
  const [staff, setStaff] = useState(0);

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
    <Card className="bg-card border-border mb-8">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5 justify-between">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Bookings this month</span>
                <span className="text-foreground font-medium">
                  {bookings} / {limits.bookingsPerMonth ?? "∞"}
                </span>
              </div>
              {limits.bookingsPerMonth !== null && <Progress value={bPct} className="h-2" />}
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Staff members</span>
                <span className="text-foreground font-medium">
                  {staff} / {limits.staff ?? "∞"}
                </span>
              </div>
              {limits.staff !== null && <Progress value={sPct} className="h-2" />}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <Sparkles size={12} /> {limits.name} plan
            </span>
            {showUpgrade && (
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/pricing">
                  <AlertTriangle size={14} className="mr-1.5" />
                  Upgrade to {TIER_LIMITS[next].name}
                </Link>
              </Button>
            )}
            {!showUpgrade && tier !== "platinum" && (
              <Button asChild size="sm" variant="outline">
                <Link to="/pricing">Upgrade</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageBanner;
