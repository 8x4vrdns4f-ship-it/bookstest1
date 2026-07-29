import { useEffect, useMemo, useState } from "react";
import { Star, MessageSquare, Calendar, TrendingUp, Reply, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import PageHeader from "@/components/app/PageHeader";
import SectionCard from "@/components/app/SectionCard";
import StatCard from "@/components/app/StatCard";
import EmptyState from "@/components/app/EmptyState";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking_id: string;
  bookings: {
    service: string | null;
    client_name: string | null;
    booking_date: string | null;
    assigned_employee_id: string | null;
  } | null;
};

type EmployeeRow = { id: string; name: string | null };

const PAGE_SIZE = 20;

function firstName(n: string | null | undefined) {
  if (!n) return "Client";
  return n.trim().split(/\s+/)[0];
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const ctx = useDashboardContext();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!ctx) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [rev, emp] = await Promise.all([
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, booking_id, bookings(service, client_name, booking_date, assigned_employee_id)")
          .eq("user_id", ctx.businessUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("employees")
          .select("id, name")
          .eq("user_id", ctx.businessUserId),
      ]);
      if (!active) return;
      setReviews((rev.data as any) ?? []);
      setEmployees((emp.data as any) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [ctx]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = reviews.filter((r) => new Date(r.created_at) >= monthStart).length;
    const fives = reviews.filter((r) => r.rating === 5).length;
    const fiveShare = total ? Math.round((fives / total) * 100) : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return { total, avg, thisMonth, fiveShare, distribution };
  }, [reviews]);

  const staffBreakdown = useMemo(() => {
    if (!employees.length) return [];
    const map = new Map<string, { name: string; sum: number; count: number }>();
    for (const e of employees) {
      map.set(e.id, { name: e.name || "Unnamed", sum: 0, count: 0 });
    }
    for (const r of reviews) {
      const empId = r.bookings?.assigned_employee_id;
      if (!empId) continue;
      const entry = map.get(empId);
      if (!entry) continue;
      entry.sum += r.rating;
      entry.count += 1;
    }
    return Array.from(map.values())
      .filter((e) => e.count > 0)
      .map((e) => ({ name: e.name, avg: e.sum / e.count, count: e.count }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count);
  }, [reviews, employees]);

  if (!ctx) return null;

  return (
    <>
      <SEO title="Reviews — BookSuite" description="Client ratings and feedback." path="/dashboard/reviews" noIndex />
      <PageHeader
        title="Reviews"
        description="Ratings and feedback from clients after their appointments."
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<Star className="h-8 w-8" />}
            title="No reviews yet"
            description="Reviews arrive automatically after a client's appointment. Once a few come in, you'll see your average rating and comments here."
          />
        </SectionCard>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Average rating"
              value={
                <span className="inline-flex items-baseline gap-2">
                  {stats.avg.toFixed(1)}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </span>
              }
              icon={<Star className="h-4 w-4" />}
              hint="out of 5"
            />
            <StatCard
              label="Total reviews"
              value={stats.total}
              icon={<MessageSquare className="h-4 w-4" />}
            />
            <StatCard
              label="This month"
              value={stats.thisMonth}
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              label="5-star share"
              value={`${stats.fiveShare}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <SectionCard title="Rating distribution">
            <div className="space-y-2">
              {stats.distribution.map(({ star, count }) => {
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-8 shrink-0 text-muted-foreground tabular-nums">{star}★</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-muted-foreground tabular-nums">
                      {count} · {Math.round(pct)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {staffBreakdown.length > 0 && (
            <SectionCard title="By staff member">
              <div className="divide-y divide-border">
                {staffBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <Stars value={Math.round(s.avg)} />
                      <span className="tabular-nums font-medium w-8 text-right">{s.avg.toFixed(1)}</span>
                      <span className="text-muted-foreground tabular-nums w-20 text-right">
                        {s.count} {s.count === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Recent reviews">
            <div className="space-y-3">
              {reviews.slice(0, visible).map((r) => (
                <div key={r.id} className="rounded-xl border border-border/70 bg-muted/10 p-4 space-y-2 hover:border-border transition-colors">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} size={16} />
                      <span className="text-sm font-medium">{firstName(r.bookings?.client_name)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.bookings?.service && (
                    <p className="text-xs text-muted-foreground">
                      {r.bookings.service}
                      {r.bookings.booking_date && ` · ${new Date(r.bookings.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </p>
                  )}
                  {r.comment && <p className="text-sm text-foreground/90 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
              {reviews.length > visible && (
                <div className="pt-2 text-center">
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </>
  );
}
