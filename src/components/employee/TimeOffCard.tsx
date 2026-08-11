import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { EmployeeRecord, TimeOffRequest, formatDay, todayISO } from "./types";

type Props = {
  employee: EmployeeRecord;
  requests: TimeOffRequest[];
  onChanged: () => void;
};

const statusChip = (status: string) => {
  if (status === "approved") return "text-emerald-400 bg-emerald-400/10";
  if (status === "declined") return "text-destructive bg-destructive/10";
  return "text-amber-400 bg-amber-400/10";
};

export default function TimeOffCard({ employee, requests, onChanged }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (end < start) {
      toast({ title: "End date must be after the start date", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("time_off_requests").insert({
      user_id: employee.user_id,
      employee_id: employee.id,
      start_date: start,
      end_date: end,
      reason: reason.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't send request", description: error.message, variant: "destructive" });
      return;
    }
    setReason("");
    setOpen(false);
    toast({ title: "Time off requested", description: "Your manager will review it." });
    onChanged();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("time_off_requests").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't cancel", description: error.message, variant: "destructive" });
      return;
    }
    onChanged();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-foreground text-base flex items-center gap-2">
          <CalendarOff size={16} /> Time off
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus size={14} /> Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request time off</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="to-start">From</Label>
                  <Input id="to-start" type="date" min={todayISO()} value={start} onChange={(e) => { setStart(e.target.value); if (end < e.target.value) setEnd(e.target.value); }} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="to-end">To</Label>
                  <Input id="to-end" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to-reason">Reason (optional)</Label>
                <Textarea id="to-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="bg-secondary border-border" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} className="w-full h-11 font-semibold">
                  {saving ? "Sending…" : "Send request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time off requested.</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-[14px] border border-border p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium">
                  {formatDay(r.start_date)}{r.end_date !== r.start_date ? ` – ${formatDay(r.end_date)}` : ""}
                </p>
                {r.reason && <p className="text-xs text-muted-foreground mt-0.5 break-words">{r.reason}</p>}
                {r.decision_note && <p className="text-xs text-muted-foreground mt-0.5">Manager: {r.decision_note}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusChip(r.status)}`}>{r.status}</span>
                {r.status === "pending" && (
                  <button type="button" onClick={() => cancel(r.id)} aria-label="Cancel request" className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
