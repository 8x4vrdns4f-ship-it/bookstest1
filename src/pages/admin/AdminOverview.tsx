import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/app/StatCard";
import SectionCard from "@/components/app/SectionCard";
import { Users, Building2, CalendarCheck, CreditCard, Mail, Gift } from "lucide-react";

type Stats = {
  total_users: number;
  total_businesses: number;
  active_subscriptions: number;
  gold_subscriptions: number;
  platinum_subscriptions: number;
  mrr_estimate: number;
  bookings_total: number;
  bookings_last_30d: number;
  open_messages: number;
  gift_codes_total: number;
};

type Signup = {
  user_id: string;
  owner_email: string;
  display_name: string | null;
  created_at: string;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [statsRes, signupsRes] = await Promise.all([
        supabase.rpc("admin_platform_stats"),
        supabase.rpc("admin_recent_signups", { p_limit: 10 }),
      ]);
      if (!statsRes.error) setStats((statsRes.data as unknown as Stats[])[0] ?? null);
      if (!signupsRes.error) setSignups(signupsRes.data as unknown as Signup[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading platform stats…</p>;
  }

  if (!stats) {
    return <p className="text-sm text-destructive">Could not load platform stats.</p>;
  }

  const silver = Math.max(0, stats.active_subscriptions - stats.gold_subscriptions - stats.platinum_subscriptions);

  const cards = [
    { label: "Total users", value: stats.total_users, icon: <Users className="h-4 w-4" /> },
    { label: "Businesses", value: stats.total_businesses, icon: <Building2 className="h-4 w-4" /> },
    { label: "Active subscriptions", value: stats.active_subscriptions, icon: <CreditCard className="h-4 w-4" />, hint: `${silver} silver · ${stats.gold_subscriptions} gold · ${stats.platinum_subscriptions} platinum` },
    { label: "Estimated MRR", value: `£${Number(stats.mrr_estimate).toLocaleString("en-GB")}`, icon: <CreditCard className="h-4 w-4" /> },
    { label: "Bookings (all time)", value: stats.bookings_total, icon: <CalendarCheck className="h-4 w-4" />, hint: `${stats.bookings_last_30d} in the last 30 days` },
    { label: "Messages to reply", value: stats.open_messages, icon: <Mail className="h-4 w-4" /> },
    { label: "Gift codes", value: stats.gift_codes_total, icon: <CreditCard className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} hint={c.hint} />
        ))}
      </div>

      <SectionCard title="Recent signups" description="The newest accounts created on BookSuite">
        {signups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signups yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {signups.map((s) => (
              <div key={s.user_id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.display_name || "Unnamed user"}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.owner_email}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
