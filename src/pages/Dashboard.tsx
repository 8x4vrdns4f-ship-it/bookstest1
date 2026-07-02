import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Clock, Code2, Plus, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS } from "@/lib/tierLimits";
import { useDashboardContext } from "@/hooks/useDashboardContext";

import AddEmployeeDialog from "@/components/dashboard/AddEmployeeDialog";
import EmbedWidgetDialog from "@/components/dashboard/EmbedWidgetDialog";
import PaymentsCard from "@/components/dashboard/PaymentsCard";
import BookingsList from "@/components/dashboard/BookingsList";
import BookingRequestsCard from "@/components/dashboard/BookingRequestsCard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import UsageBanner from "@/components/dashboard/UsageBanner";
import SubscriptionWidget from "@/components/dashboard/SubscriptionWidget";
import LockedFeature from "@/components/LockedFeature";
import JoinRequestsCard from "@/components/dashboard/JoinRequestsCard";
import GiftCodesCard from "@/components/dashboard/GiftCodesCard";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import ReceptionistView from "@/components/dashboard/ReceptionistView";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

type StatCard = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
};

export default function Dashboard() {
  const ctx = useDashboardContext();
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const canSeeAdvanced = tier ? TIER_LIMITS[tier].advancedAnalytics : false;
  const [stats, setStats] = useState({ todayBookings: 0, totalClients: 0, upcoming: 0 });

  useEffect(() => {
    if (!ctx) return;
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_date", today),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }).gte("booking_date", today).in("status", ["pending", "confirmed"]),
    ]).then(([t, c, u]) => {
      setStats({
        todayBookings: t.count || 0,
        totalClients: c.count || 0,
        upcoming: u.count || 0,
      });
    });
  }, [ctx]);

  if (!ctx) return null;

  const { user, businessUserId, displayName, role, isOwner } = ctx;
  const isReceptionist = role.name === "receptionist";

  const statCards: StatCard[] = [
    { label: "Bookings today", value: String(stats.todayBookings), icon: CalendarDays, hint: "Confirmed & pending" },
    { label: "Total clients", value: String(stats.totalClients), icon: Users, hint: "Lifetime" },
    { label: "Upcoming", value: String(stats.upcoming), icon: Clock, hint: "From today onwards" },
  ];

  return (
    <>
      <SEO
        title="Dashboard — BookSuite"
        description="Your BookSuite dashboard: today's bookings, upcoming appointments, clients, and staff at a glance."
        path="/dashboard"
        noIndex
      />

      <PageHeader
        title={`Welcome back, ${displayName.split(" ")[0] || "there"}`}
        description={isOwner ? "Here's what's happening with your business today." : `Signed in as ${role.name}.`}
        actions={
          isOwner ? (
            <>
              <EmbedWidgetDialog
                userId={user.id}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <Code2 className="h-4 w-4" /> Embed widget
                  </Button>
                }
              />
              <Button
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)]"
                onClick={() => navigate("/dashboard/bookings")}
              >
                <Plus className="h-4 w-4" /> New booking
              </Button>
            </>
          ) : null
        }
      />

      {isReceptionist ? (
        <ReceptionistView businessUserId={businessUserId} />
      ) : (
        <div className="space-y-8">
          {isOwner && <SubscriptionWidget />}
          {isOwner && <OnboardingChecklist userId={user.id} />}
          {isOwner && <PaymentsCard userId={user.id} />}
          {isOwner && <UsageBanner userId={businessUserId} />}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {statCards.map((stat) => (
              <Card
                key={stat.label}
                className="surface-card hover:border-primary/30 transition-colors group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="stat-label">{stat.label}</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <p className="stat-value">{stat.value}</p>
                    {stat.hint && <span className="text-xs text-muted-foreground">{stat.hint}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isOwner && <GiftCodesCard />}

          {role.canApprove && <JoinRequestsCard businessUserId={businessUserId} />}

          {/* Charts */}
          <div>
            {canSeeAdvanced ? (
              <DashboardCharts userId={businessUserId} />
            ) : (
              <div className="relative min-h-[260px]">
                <LockedFeature
                  requiredTier="gold"
                  title="Advanced Analytics"
                  description="Charts, trends and revenue insights are available on Gold and Platinum."
                >
                  <DashboardCharts userId={businessUserId} />
                </LockedFeature>
              </div>
            )}
          </div>

          {/* Recent bookings */}
          <Card className="surface-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Recent bookings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/bookings")}
                className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <BookingRequestsCard userId={businessUserId} />
              <BookingsList userId={businessUserId} />
            </CardContent>
          </Card>

          {isOwner && (
            <div className="flex justify-end">
              <AddEmployeeDialog userId={user.id} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
