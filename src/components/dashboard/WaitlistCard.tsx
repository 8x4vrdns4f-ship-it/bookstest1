import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SectionCard from "@/components/app/SectionCard";
import EmptyState from "@/components/app/EmptyState";
import { Mail, Trash2, Clock } from "lucide-react";

interface Entry {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  service: string | null;
  preferred_date: string;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  party_size: number | null;
  notes: string | null;
  status: string;
  notified_at: string | null;
  created_at: string;
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const WaitlistCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("waitlist_entries")
      .select("*")
      .eq("user_id", userId)
      .order("preferred_date", { ascending: true })
      .order("created_at", { ascending: true });
    setEntries((data as Entry[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const notify = async (entry: Entry) => {
    setBusyId(entry.id);
    const { error } = await supabase.functions.invoke("notify-waitlist", {
      body: { user_id: userId, date: entry.preferred_date },
    });
    setBusyId(null);
    if (error) toast({ title: "Notify failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Notified everyone on that date" }); load(); }
  };

  const remove = async (entry: Entry) => {
    setBusyId(entry.id);
    const { error } = await supabase.from("waitlist_entries").delete().eq("id", entry.id);
    setBusyId(null);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Removed" }); load(); }
  };

  return (
    <SectionCard>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-primary" />
        <h3 className="text-base font-semibold">Waitlist</h3>
        <Badge variant="outline" className="ml-auto">{entries.length}</Badge>
      </div>
      {loading ? (
        <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
      ) : entries.length === 0 ? (
        <EmptyState title="No one on the waitlist" description="When someone joins, they'll show up here." />
      ) : (
        <div className="space-y-2">
          {entries.map((e) => {
            const win = e.preferred_time_start && e.preferred_time_end
              ? `${e.preferred_time_start.slice(0,5)}–${e.preferred_time_end.slice(0,5)}`
              : e.preferred_time_start?.slice(0,5) || e.preferred_time_end?.slice(0,5) || "Any time";
            return (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{e.client_name}</span>
                    <Badge variant="outline" className="text-xs">{e.status}</Badge>
                    {e.party_size && <Badge variant="outline" className="text-xs">Party {e.party_size}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {e.client_email}{e.client_phone && ` • ${e.client_phone}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(e.preferred_date)} • {win}{e.service && ` • ${e.service}`}
                  </div>
                  {e.notes && <div className="text-xs text-muted-foreground mt-0.5 italic">"{e.notes}"</div>}
                </div>
                <Button size="sm" variant="outline" disabled={busyId === e.id || e.status !== "active"} onClick={() => notify(e)}>
                  <Mail size={14} className="mr-1" /> Notify
                </Button>
                <Button size="icon" variant="ghost" disabled={busyId === e.id} onClick={() => remove(e)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

export default WaitlistCard;
