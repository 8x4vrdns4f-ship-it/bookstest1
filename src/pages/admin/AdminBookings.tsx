import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";
import BusinessDetailSheet from "@/components/admin/BusinessDetailSheet";

type BookingRow = {
  booking_id: string;
  business_user_id: string;
  business_name: string | null;
  client_name: string;
  client_email: string | null;
  service: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  charge_amount: number | null;
  platform_fee_amount: number | null;
  created_at: string;
};

const statusFilters = ["all", "confirmed", "pending", "completed", "cancelled", "declined", "no-show"];
const paymentFilters = ["all", "paid", "unpaid", "refunded", "deposit_paid"];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const money = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(n));

export default function AdminBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_bookings", { p_limit: 500 });
      if (error) setError(error.message);
      else setRows((data as unknown as BookingRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const match =
        r.client_name?.toLowerCase().includes(q) ||
        r.client_email?.toLowerCase().includes(q) ||
        r.business_name?.toLowerCase().includes(q) ||
        r.service?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== "all" && r.status?.toLowerCase() !== statusFilter) return false;
    if (paymentFilter !== "all" && r.payment_status?.toLowerCase() !== paymentFilter) return false;
    return true;
  });

  const totalCharged = filtered.reduce((sum, r) => sum + Number(r.charge_amount ?? 0), 0);
  const totalFees = filtered.reduce((sum, r) => sum + Number(r.platform_fee_amount ?? 0), 0);

  if (loading) return <p className="text-sm text-muted-foreground">Loading bookings…</p>;
  if (error) return <p className="text-sm text-destructive">Could not load bookings: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold">{filtered.length}</p>
          <p className="text-[11px] text-muted-foreground">Bookings shown</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold">{money(totalCharged)}</p>
          <p className="text-[11px] text-muted-foreground">Charged (filtered)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold">{money(totalFees)}</p>
          <p className="text-[11px] text-muted-foreground">Platform fees (filtered)</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client, business or service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {paymentFilters.map((f) => (
            <button
              key={`p-${f}`}
              type="button"
              onClick={() => setPaymentFilter(f)}
              className={`px-2.5 py-1 rounded-full text-xs capitalize border transition-colors ${
                paymentFilter === f
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "any payment" : f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <SectionCard title={`Bookings (${filtered.length})`}>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings match those filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Client</th>
                  <th className="py-2 pr-4">Business</th>
                  <th className="py-2 pr-4">Service</th>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Charged</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.booking_id}
                    onClick={() => setSelected(r.business_user_id)}
                    className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium">{r.client_name}</td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{r.business_name || "—"}</td>
                    <td className="py-3 pr-4 text-sm">{r.service}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(r.booking_date)} · {String(r.booking_time).slice(0, 5)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={r.status === "confirmed" || r.status === "completed" ? "default" : "secondary"} className="capitalize">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={r.payment_status === "paid" ? "default" : r.payment_status === "refunded" ? "destructive" : "secondary"} className="capitalize">
                        {r.payment_status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm whitespace-nowrap">{money(r.charge_amount)}</td>
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
