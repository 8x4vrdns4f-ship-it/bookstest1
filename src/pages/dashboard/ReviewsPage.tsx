import { useEffect, useMemo, useState } from "react";
import { Star, MessageSquare, Calendar, TrendingUp, Reply, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import PageHeader from "@/components/app/PageHeader";
import SectionCard from "@/components/app/SectionCard";
import StatCard from "@/components/app/StatCard";
import EmptyState from "@/components/app/EmptyState";
import SEO from "@/components/SEO";
import LockedFeature from "@/components/LockedFeature";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS } from "@/lib/tierLimits";
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
  owner_reply: string | null;
  owner_reply_at: string | null;
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
  const { tier } = useSubscription();
  const canReviews = tier ? TIER_LIMITS[tier].reviews : false;

  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ctx) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [rev, emp] = await Promise.all([
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, booking_id, owner_reply, owner_reply_at, bookings(service, client_name, booking_date, assigned_employee_id)")
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

  const startEdit = (r: ReviewRow) => {
    setEditingId(r.id);
    setDraft(r.owner_reply ?? "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };
  const saveReply = async (id: string) => {
    const text = draft.trim();
    if (!text) {
      toast({ title: "Reply is empty", variant: "destructive" });
      return;
    }
    if (text.length > 1000) {
      toast({ title: "Reply too long", description: "Max 1000 characters.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reviews").update({ owner_reply: text }).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save reply", description: error.message, variant: "destructive" });
      return;
    }
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, owner_reply: text, owner_reply_at: new Date().toISOString() } : r));
    cancelEdit();
    toast({ title: "Reply posted" });
  };
  const deleteReply = async (id: string) => {
    const { error } = await supabase.from("reviews").update({ owner_reply: null }).eq("id", id);
    if (error) {
      toast({ title: "Failed to delete reply", description: error.message, variant: "destructive" });
      return;
    }
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, owner_reply: null, owner_reply_at: null } : r));
    toast({ title: "Reply removed" });
  };

  if (!ctx) return null;

  if (!canReviews) {
    return (
      <>
        <SEO title="Reviews — BookSuite" description="Client ratings and feedback." path="/dashboard/reviews" noIndex />
        <PageHeader title="Reviews" description="Ratings and feedback from clients after their appointments." />
        <LockedFeature
          requiredTier="gold"
          title="Reviews are a Gold feature"
          description="Upgrade to Gold to collect star ratings, publish feedback on your booking page and reply to clients."
        >
          <div className="h-72 rounded-2xl border border-border bg-card" />
        </LockedFeature>
      </>
    );
  }

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

                  {editingId === r.id ? (
                    <div className="space-y-2 pt-2">
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                        placeholder="Write a public reply to this review…"
                        rows={3}
                        maxLength={1000}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground tabular-nums">{draft.length}/1000</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                          <Button size="sm" onClick={() => saveReply(r.id)} disabled={saving}>
                            {saving ? "Saving…" : "Post reply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : r.owner_reply ? (
                    <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Your reply</span>
                        <span className="text-xs text-muted-foreground">
                          {r.owner_reply_at && new Date(r.owner_reply_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{r.owner_reply}</p>
                      <div className="flex gap-1 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteReply(r.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <Button variant="outline" size="sm" onClick={() => startEdit(r)}>
                        <Reply className="h-3.5 w-3.5 mr-1" /> Reply
                      </Button>
                    </div>
                  )}
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
