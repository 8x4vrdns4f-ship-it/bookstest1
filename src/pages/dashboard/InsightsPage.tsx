import { lazy, Suspense, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  PoundSterling,
  Star,
  UserPlus,
  XCircle,
  Lightbulb,
} from "lucide-react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import {
  RANGE_LABELS,
  bookingRevenue,
  formatMoney,
  pctChange,
  useInsights,
  type BookingRow,
  type RangeKey,
} from "@/hooks/useInsights";
import PageHeader from "@/components/app/PageHeader";
import SectionCard from "@/components/app/SectionCard";
import StatCard from "@/components/app/StatCard";
import EmptyState from "@/components/app/EmptyState";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TrendChart = lazy(() =>
  import("@/components/dashboard/InsightsCharts").then((m) => ({ default: m.TrendChart })),
);
const CountBarChart = lazy(() =>
  import("@/components/dashboard/InsightsCharts").then((m) => ({ default: m.CountBarChart })),
);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CANCELLED = new Set(["cancelled", "canceled", "declined", "no_show", "expired"]);
const MIN_ROWS = 3;

function ChartFallback({ height = 240 }: { height?: number }) {
  return <Skeleton className="w-full rounded-xl" style={{ height }} />;
}

function BreakdownList({
  rows,
  emptyLabel,
}: {
  rows: { key: string; label: string; primary: string; secondary?: string; ratio: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground truncate">{r.label}</span>
            <span className="text-[13px] text-muted-foreground shrink-0">
              {r.primary}
              {r.secondary ? <span className="ml-2 text-muted-foreground/70">{r.secondary}</span> : null}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(3, Math.round(r.ratio * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function InsightsPage() {
  const ctx = useDashboardContext();
  const [range, setRange] = useState<RangeKey>("30d");
  const data = useInsights(ctx?.businessUserId, range);
  const {
    loading,
    currency,
    bookings,
    previousBookings,
    services,
    employees,
    resources,
    resourcesEnabled,
    resourceLabel,
    ratingsByEmployee,
    from,
    to,
  } = data;

  const money = (n: number) => formatMoney(n, currency);

  const metrics = useMemo(() => {
    const revenue = bookings.reduce((s, b) => s + bookingRevenue(b), 0);
    const prevRevenue = previousBookings.reduce((s, b) => s + bookingRevenue(b), 0);
    const completed = bookings.filter((b) => b.status === "completed").length;
    const lost = bookings.filter((b) => CANCELLED.has(b.status)).length;
    const total = bookings.length;
    const prevTotal = previousBookings.length;
    const prevCompleted = previousBookings.filter((b) => b.status === "completed").length;
    const prevLost = previousBookings.filter((b) => CANCELLED.has(b.status)).length;
    return {
      revenue,
      prevRevenue,
      total,
      prevTotal,
      completionRate: total ? (completed / total) * 100 : 0,
      prevCompletionRate: prevTotal ? (prevCompleted / prevTotal) * 100 : 0,
      lostRate: total ? (lost / total) * 100 : 0,
      prevLostRate: prevTotal ? (prevLost / prevTotal) * 100 : 0,
      lost,
    };
  }, [bookings, previousBookings]);

  const trend = useMemo(() => {
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    const weekly = spanDays > 45;
    const buckets = new Map<string, { label: string; bookings: number; revenue: number; sort: number }>();
    for (const b of bookings) {
      const d = new Date(`${b.booking_date}T00:00:00`);
      let key: string;
      let label: string;
      if (weekly) {
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay());
        key = start.toISOString().slice(0, 10);
        label = start.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      } else {
        key = b.booking_date;
        label = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      }
      const cur = buckets.get(key) ?? { label, bookings: 0, revenue: 0, sort: new Date(key).getTime() };
      cur.bookings += 1;
      cur.revenue += bookingRevenue(b);
      buckets.set(key, cur);
    }
    return [...buckets.values()].sort((a, b) => a.sort - b.sort);
  }, [bookings, from, to]);

  const byWeekday = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const b of bookings) counts[new Date(`${b.booking_date}T00:00:00`).getDay()] += 1;
    const ordered = [1, 2, 3, 4, 5, 6, 0];
    return ordered.map((i) => ({ label: DAY_NAMES[i], value: counts[i] }));
  }, [bookings]);

  const byHour = useMemo(() => {
    const counts = new Map<number, number>();
    for (const b of bookings) {
      const h = Number(String(b.booking_time).slice(0, 2));
      if (Number.isNaN(h)) continue;
      counts.set(h, (counts.get(h) ?? 0) + 1);
    }
    const hours = [...counts.keys()].sort((a, b) => a - b);
    if (hours.length === 0) return [];
    const min = hours[0];
    const max = hours[hours.length - 1];
    const out: { label: string; value: number }[] = [];
    for (let h = min; h <= max; h++) {
      out.push({ label: `${String(h).padStart(2, "0")}`, value: counts.get(h) ?? 0 });
    }
    return out;
  }, [bookings]);

  const groupBy = (
    rows: BookingRow[],
    keyOf: (b: BookingRow) => string | null,
    nameOf: (key: string) => string,
  ) => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const b of rows) {
      const k = keyOf(b);
      if (!k) continue;
      const cur = map.get(k) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += bookingRevenue(b);
      map.set(k, cur);
    }
    const max = Math.max(1, ...[...map.values()].map((v) => v.count));
    return [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([k, v]) => ({
        key: k,
        label: nameOf(k),
        primary: `${v.count} booking${v.count === 1 ? "" : "s"}`,
        secondary: v.revenue > 0 ? money(v.revenue) : undefined,
        ratio: v.count / max,
      }));
  };

  const serviceRows = useMemo(() => {
    const names = new Map(services.map((s) => [s.id, s.name || "Service"]));
    return groupBy(
      bookings,
      (b) => b.service_id ?? (b.service ? `name:${b.service}` : null),
      (k) => (k.startsWith("name:") ? k.slice(5) : names.get(k) || "Service"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, services, currency]);

  const resourceRows = useMemo(() => {
    const names = new Map(resources.map((r) => [r.id, r.name || resourceLabel]));
    return groupBy(bookings, (b) => b.resource_id, (k) => names.get(k) || resourceLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, resources, resourceLabel, currency]);

  const staffRows = useMemo(() => {
    const names = new Map(employees.map((e) => [e.id, e.name || "Staff"]));
    const map = new Map<string, { count: number; completed: number }>();
    for (const b of bookings) {
      if (!b.assigned_employee_id) continue;
      const cur = map.get(b.assigned_employee_id) ?? { count: 0, completed: 0 };
      cur.count += 1;
      if (b.status === "completed") cur.completed += 1;
      map.set(b.assigned_employee_id, cur);
    }
    return [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, v]) => {
        const r = ratingsByEmployee[id];
        return {
          id,
          name: names.get(id) || "Staff",
          count: v.count,
          completion: v.count ? Math.round((v.completed / v.count) * 100) : 0,
          rating: r && r.count ? (r.total / r.count).toFixed(1) : null,
        };
      });
  }, [bookings, employees, ratingsByEmployee]);

  const clientSplit = useMemo(() => {
    const seen = new Map<string, number>();
    for (const b of bookings) {
      const key = (b.client_email || b.client_name || "").trim().toLowerCase();
      if (!key) continue;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    let returning = 0;
    seen.forEach((v) => {
      if (v > 1) returning += 1;
    });
    return { total: seen.size, returning, fresh: seen.size - returning };
  }, [bookings]);

  const callouts = useMemo(() => {
    const out: string[] = [];
    if (bookings.length < MIN_ROWS) return out;
    const busiest = [...byWeekday].sort((a, b) => b.value - a.value)[0];
    const quietest = [...byWeekday].sort((a, b) => a.value - b.value)[0];
    if (busiest && quietest && busiest.value > 0 && busiest.label !== quietest.label) {
      const drop = Math.round(((busiest.value - quietest.value) / busiest.value) * 100);
      out.push(
        `${busiest.label} is your busiest day; ${quietest.label} is the quietest with ${drop}% fewer bookings.`,
      );
    }
    if (serviceRows.length > 0) {
      const topShare = Math.round((Number(serviceRows[0].primary.split(" ")[0]) / bookings.length) * 100);
      out.push(`${serviceRows[0].label} accounts for ${topShare}% of your bookings in this period.`);
    }
    if (metrics.lost > 0) {
      out.push(
        `${metrics.lost} booking${metrics.lost === 1 ? "" : "s"} were cancelled or missed (${Math.round(metrics.lostRate)}%). Requiring a deposit usually cuts this.`,
      );
    }
    if (clientSplit.total > 0) {
      const pct = Math.round((clientSplit.returning / clientSplit.total) * 100);
      out.push(`${pct}% of clients in this period booked more than once.`);
    }
    if (byHour.length > 0) {
      const peak = [...byHour].sort((a, b) => b.value - a.value)[0];
      out.push(`Your peak hour is ${peak.label}:00 — make sure you have cover then.`);
    }
    return out.slice(0, 4);
  }, [bookings, byWeekday, serviceRows, metrics, clientSplit, byHour]);

  const downloadCsv = () => {
    const header = [
      "date",
      "time",
      "client",
      "service",
      "status",
      "payment_status",
      "amount",
    ];
    const lines = bookings.map((b) =>
      [
        b.booking_date,
        b.booking_time,
        b.client_name ?? "",
        b.service ?? "",
        b.status,
        b.payment_status,
        bookingRevenue(b).toFixed(2),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booksuite-bookings-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const trendFor = (cur: number, prev: number) => {
    const p = pctChange(cur, prev);
    if (p === null) return undefined;
    return { value: `${p >= 0 ? "+" : ""}${Math.round(p)}%`, positive: p >= 0 };
  };

  const enoughData = bookings.length >= MIN_ROWS;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <SEO
        title="Insights | BookSuite"
        description="Revenue, booking trends, top services and staff performance for your business."
        path="/dashboard/insights"
        noIndex

      />
      <PageHeader
        title="Insights"
        description={`${RANGE_LABELS[range]} · ${from.toLocaleDateString()} – ${to.toLocaleDateString()}`}
        actions={
          <>
            <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {RANGE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={downloadCsv} disabled={bookings.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[130px] rounded-[20px]" />
            ))}
          </div>
          <Skeleton className="h-[320px] rounded-[20px]" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Revenue taken"
              value={money(metrics.revenue)}
              icon={<PoundSterling className="h-4 w-4" />}
              trend={trendFor(metrics.revenue, metrics.prevRevenue)}
              hint="vs previous period"
            />
            <StatCard
              label="Bookings"
              value={metrics.total}
              icon={<CalendarDays className="h-4 w-4" />}
              trend={trendFor(metrics.total, metrics.prevTotal)}
              hint="vs previous period"
            />
            <StatCard
              label="Completion rate"
              value={`${Math.round(metrics.completionRate)}%`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              trend={trendFor(metrics.completionRate, metrics.prevCompletionRate)}
              hint="marked completed"
            />
            <StatCard
              label="Cancelled / no-show"
              value={`${Math.round(metrics.lostRate)}%`}
              icon={<XCircle className="h-4 w-4" />}
              trend={
                (() => {
                  const t = trendFor(metrics.lostRate, metrics.prevLostRate);
                  return t ? { value: t.value, positive: !t.positive } : undefined;
                })()
              }
              hint={`${metrics.lost} booking${metrics.lost === 1 ? "" : "s"}`}
            />
          </div>

          {!enoughData ? (
            <SectionCard title="Not enough data yet" icon={<BarChart3 className="h-4 w-4" />}>
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="We need a few more bookings"
                description="Once you have a handful of bookings in this period, trends, service and staff breakdowns will appear here automatically."
              />
            </SectionCard>
          ) : (
            <>
              <SectionCard
                title="Bookings over time"
                description="How demand moved across the selected period"
                icon={<BarChart3 className="h-4 w-4" />}
              >
                <div className="overflow-x-auto">
                  <div className="min-w-[420px]">
                    <Suspense fallback={<ChartFallback />}>
                      <TrendChart data={trend} moneyFormatter={money} />
                    </Suspense>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Busiest days" description="Bookings by day of week">
                  <div className="overflow-x-auto">
                    <div className="min-w-[360px]">
                      <Suspense fallback={<ChartFallback height={220} />}>
                        <CountBarChart data={byWeekday} />
                      </Suspense>
                    </div>
                  </div>
                </SectionCard>
                <SectionCard title="Busiest hours" description="Bookings by start hour">
                  <div className="overflow-x-auto">
                    <div className="min-w-[360px]">
                      <Suspense fallback={<ChartFallback height={220} />}>
                        <CountBarChart data={byHour} />
                      </Suspense>
                    </div>
                  </div>
                </SectionCard>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Top services" description="By bookings, with revenue taken">
                  <BreakdownList rows={serviceRows} emptyLabel="No services recorded in this period." />
                </SectionCard>

                <SectionCard title="Staff performance" icon={<Star className="h-4 w-4" />}>
                  {staffRows.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      No bookings were assigned to staff in this period.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {staffRows.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <span className="text-[13px] font-medium truncate">{s.name}</span>
                          <span className="text-[12px] text-muted-foreground shrink-0 flex items-center gap-3">
                            <span>{s.count} booked</span>
                            <span>{s.completion}% done</span>
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              {s.rating ?? "—"}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Clients" icon={<UserPlus className="h-4 w-4" />}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="stat-value">{clientSplit.total}</p>
                      <p className="stat-label mt-1">Total</p>
                    </div>
                    <div>
                      <p className="stat-value">{clientSplit.fresh}</p>
                      <p className="stat-label mt-1">New</p>
                    </div>
                    <div>
                      <p className="stat-value">{clientSplit.returning}</p>
                      <p className="stat-label mt-1">Returning</p>
                    </div>
                  </div>
                </SectionCard>

                {resourcesEnabled ? (
                  <SectionCard title={`${resourceLabel} usage`} description="Bookings per resource">
                    <BreakdownList rows={resourceRows} emptyLabel="No resources were booked in this period." />
                  </SectionCard>
                ) : (
                  <SectionCard title="What this tells you" icon={<Lightbulb className="h-4 w-4" />}>
                    {callouts.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground">No observations yet.</p>
                    ) : (
                      <ul className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
                        {callouts.map((c) => (
                          <li key={c} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>
                )}
              </div>

              {resourcesEnabled && callouts.length > 0 && (
                <SectionCard title="What this tells you" icon={<Lightbulb className="h-4 w-4" />}>
                  <ul className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
                    {callouts.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
