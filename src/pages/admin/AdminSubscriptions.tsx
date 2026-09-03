import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";
import BusinessDetailSheet from "@/components/admin/BusinessDetailSheet";

type SubRow = {
  user_id: string;
  owner_email: string;
  business_name: string | null;
  tier: string;
  subscribed: boolean;
  status: string;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

const tierFilters = ["all", "silver", "gold", "platinum", "none"];
const statusFilters = ["all", "active", "cancelled", "canceled", "past_due", "trialing"];

const TIER_PRICE: Record<string, number> = { silver: 20, gold: 59, platinum: 199 };

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function AdminSubscriptions() {
  const [rows, setRows] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_subscriptions");
      if (error) setError(error.message);
      else setRows((data as unknown as SubRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const match =
        r.owner_email?.toLowerCase().includes(q) ||
        r.business_name?.toLowerCase().includes(q) ||
        r.stripe_customer_id?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (tierFilter !== "all" && (r.tier || "none") !== tierFilter) return false;
    if (statusFilter !== "all") {
      const st = r.status?.toLowerCase() ?? "";
      const cancelled = r.canceled_at != null || st === "canceled" || st === "cancelled";
      if (statusFilter === "cancelled" && !cancelled) return false;
      if (statusFilter !== "cancelled" && st !== statusFilter) return false;
    }
    return true;
  });

  const active = rows.filter((r) => r.subscribed);
  const tierCounts = active.reduce<Record<string, number>>((acc, r) => {
    acc[r.tier || "none"] = (acc[r.tier || "none"] ?? 0) + 1;
    return acc;
  }, {});
  const mrr = active.reduce((sum, r) => sum + (TIER_PRICE[r.tier] ?? 0), 0);

  if (loading) return <p className="text-sm text-muted-foreground">Loading subscriptions…</p>;
  if (error) return <p className="text-sm text-destructive">Could not load subscriptions: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold">{active.length}</p>
          <p className="text-[11px] text-muted-foreground">Active subscriptions</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold">{tierCounts.silver ?? 0} · {tierCounts.gold ?? 0} · {tierCounts.platinum ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Silver · Gold · Platinum</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold">£{mrr.toLocaleString("en-GB")}</p>
          <p className="text-[11px] text-muted-foreground">Estimated MRR</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold">{rows.length}</p>
          <p className="text-[11px] text-muted-foreground">Subscription records</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search owner email, business or Stripe ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tierFilters.map((f) => (
            <button
              key={`t-${f}`}
              type="button"
              onClick={() => setTierFilter(f)}
              className={`px-2.5 py-1 rounded-full text-xs capitalize border transition-colors ${
                tierFilter === f
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "any tier" : f === "none" ? "no plan" : f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={`s-${f}`}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-2.5 py-1 rounded-full text-xs capitalize border transition-colors ${
                statusFilter === f
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "any status" : f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <SectionCard title={`Subscriptions (${filtered.length})`}>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscriptions match those filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Business</th>
                  <th className="py-2 pr-4">Owner</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Renews / ends</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.user_id}
                    onClick={() => setSelected(r.user_id)}
                    className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium">{r.business_name || "—"}</td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{r.owner_email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className="capitalize">
                        {r.tier === "none" ? "No plan" : r.tier}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={r.subscribed ? "default" : r.canceled_at ? "destructive" : "secondary"} className="capitalize">
                        {r.subscribed ? "active" : r.canceled_at ? "cancelled" : r.status || "inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.current_period_end)}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.created_at)}</td>
                    <td className="py-3 text-muted-foreground"><ChevronRight className="h-4 w-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <BusinessDetailSheet userId={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
