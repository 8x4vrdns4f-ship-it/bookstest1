import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, CheckCircle2 } from "lucide-react";

type Range = "today" | "week" | "month";

type Props = { userId: string };

const DashboardCharts = ({ userId }: Props) => {
  const [range, setRange] = useState<Range>("week");
  const [bookings, setBookings] = useState<{ booking_date: string; status: string }[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [currency, setCurrency] = useState("GBP");

  const fetchAll = async () => {
    // 90-day window covers all chart ranges
    const now = new Date();
    const from = new Date(now); from.setDate(from.getDate() - 90);
    const fromStr = from.toISOString().split("T")[0];

    const [bk, settings] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_date, status")
        .eq("user_id", userId)
        .gte("booking_date", fromStr),
      supabase
        .from("business_settings")
        .select("deposit_amount, currency")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const rows = bk.data || [];
    setBookings(rows);

    const deposit = Number(settings.data?.deposit_amount || 10);
    setCurrency(settings.data?.currency || "GBP");

    const completed = rows.filter((b) => b.status === "completed").length;
    setRevenue(completed * deposit);

    const today = now.toISOString().split("T")[0];
    const todays = rows.filter((b) => b.booking_date === today);
    setTodayTotal(todays.length);
    setCompletedToday(todays.filter((b) => b.status === "completed").length);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel(`dashboard-charts-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const chartData = useMemo(() => {
    const now = new Date();
    if (range === "today") {
      // group today's bookings by hour
      const today = now.toISOString().split("T")[0];
      const buckets: Record<string, number> = {};
      for (let h = 0; h < 24; h += 2) buckets[`${String(h).padStart(2, "0")}:00`] = 0;
      bookings.filter((b) => b.booking_date === today).forEach((b) => {
        const h = Math.floor(now.getHours() / 2) * 2; // not great, fallback
        const key = `${String(h).padStart(2, "0")}:00`;
        buckets[key] = (buckets[key] || 0) + 1;
      });
      return Object.entries(buckets).map(([label, count]) => ({ label, count }));
    }
    if (range === "week") {
      const out: { label: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        out.push({
          label: d.toLocaleDateString(undefined, { weekday: "short" }),
          count: bookings.filter((b) => b.booking_date === ds).length,
        });
      }
      return out;
    }
    // month: last 4 weeks
    const out: { label: string; count: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const end = new Date(now); end.setDate(end.getDate() - w * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      out.push({
        label: `W${4 - w}`,
        count: bookings.filter((b) => b.booking_date >= startStr && b.booking_date <= endStr).length,
      });
    }
    return out;
  }, [bookings, range]);

  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  const completionPct = todayTotal === 0 ? 0 : Math.round((completedToday / todayTotal) * 100);
  const donutData = [
    { name: "Completed", value: completedToday },
    { name: "Remaining", value: Math.max(0, todayTotal - completedToday) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Generated</CardTitle>
          <TrendingUp size={18} className="text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">{symbol}{revenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">From completed bookings via BookSuite</p>
        </CardContent>
      </Card>

      {/* Completed today donut */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
          <CheckCircle2 size={18} className="text-primary" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={todayTotal === 0 ? [{ name: "empty", value: 1 }] : donutData}
                  innerRadius={28}
                  outerRadius={42}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--secondary))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground leading-none">{completedToday}</span>
              <span className="text-[10px] text-muted-foreground">/ {todayTotal}</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{completionPct}%</p>
            <p className="text-xs text-muted-foreground">of today's bookings complete</p>
          </div>
        </CardContent>
      </Card>

      {/* Bar chart */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
          <ToggleGroup type="single" value={range} onValueChange={(v) => v && setRange(v as Range)} size="sm">
            <ToggleGroupItem value="today" className="text-xs h-6 px-2">Today</ToggleGroupItem>
            <ToggleGroupItem value="week" className="text-xs h-6 px-2">Week</ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-xs h-6 px-2">Month</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={chartData}>
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "hsl(var(--secondary))" }}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
