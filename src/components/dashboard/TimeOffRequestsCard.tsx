import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CalendarOff } from "lucide-react";

type Row = {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  decision_note: string | null;
  created_at: string;
};

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

const TimeOffRequestsCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [reqRes, empRes] = await Promise.all([
      supabase
        .from("time_off_requests")
        .select("id, employee_id, start_date, end_date, reason, status, decision_note, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("employees").select("id, name").eq("user_id", userId),
    ]);
    setRows((reqRes.data as Row[]) || []);
    const map: Record<string, string> = {};
    (empRes.data || []).forEach((e: { id: string; name: string }) => { map[e.id] = e.name; });
    setNames(map);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const decide = async (row: Row, status: "approved" | "declined") => {
    setBusy(row.id);
    const { error } = await supabase
      .from("time_off_requests")
      .update({
        status,
        decided_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        decided_at: new Date().toISOString(),
        decision_note: notes[row.id]?.trim() || null,
      })
      .eq("id", row.id);
    setBusy(null);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "Time off approved" : "Time off declined" });
    load();
  };

  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending").slice(0, 5);

  if (rows.length === 0) return null;

  return (
    <Card className="bg-card border-border mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base flex items-center gap-2">
          <CalendarOff size={16} /> Time off requests
          {pending.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10">{pending.length} pending</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((r) => (
          <div key={r.id} className="rounded-[14px] border border-border p-3 space-y-2">
            <div>
              <p className="text-sm text-foreground font-medium">
                {names[r.employee_id] || "Team member"} · {fmt(r.start_date)}
                {r.end_date !== r.start_date ? ` – ${fmt(r.end_date)}` : ""}
              </p>
              {r.reason && <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>}
            </div>
            <Input
              placeholder="Note back (optional)"
              value={notes[r.id] || ""}
              onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
              className="bg-secondary border-border h-9"
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={busy === r.id} onClick={() => decide(r, "approved")}>Approve</Button>
              <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => decide(r, "declined")}>Decline</Button>
            </div>
          </div>
        ))}

        {decided.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Recent decisions</p>
            {decided.map((r) => (
              <p key={r.id} className="text-xs text-muted-foreground">
                {names[r.employee_id] || "Team member"} · {fmt(r.start_date)} —{" "}
                <span className={r.status === "approved" ? "text-emerald-400" : "text-destructive"}>{r.status}</span>
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeOffRequestsCard;
