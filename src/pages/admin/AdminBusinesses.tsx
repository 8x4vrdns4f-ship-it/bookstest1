import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";
import BusinessDetailSheet from "@/components/admin/BusinessDetailSheet";

type Business = {
  user_id: string;
  owner_email: string;
  business_name: string | null;
  business_category: string | null;
  tier: string;
  subscribed: boolean;
  status: string;
  bookings_count: number;
  created_at: string;
};

export default function AdminBusinesses() {
  const [rows, setRows] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_businesses");
      if (error) setError(error.message);
      else setRows((data as unknown as Business[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.owner_email?.toLowerCase().includes(q) ||
      r.business_name?.toLowerCase().includes(q)
    );
  });

  if (loading) return <p className="text-sm text-muted-foreground">Loading businesses…</p>;
  if (error) return <p className="text-sm text-destructive">Could not load businesses: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by owner email or business name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <SectionCard title={`Businesses (${filtered.length})`}>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No businesses match that search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Business</th>
                  <th className="py-2 pr-4">Owner</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Bookings</th>
                  <th className="py-2 pr-4">Joined</th>
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
                    <td className="py-3 pr-4 text-sm capitalize">{r.business_category || "—"}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={r.status === "active" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}
                        className="capitalize"
                      >
                        {r.tier === "none" ? "No plan" : r.tier} · {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm">{r.bookings_count}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
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
