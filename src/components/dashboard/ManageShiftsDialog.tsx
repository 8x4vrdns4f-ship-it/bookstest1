import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
}

interface ShiftRow {
  employee_id: string;
  on: boolean;
  start_time: string;
  end_time: string;
  shiftId?: string;
}

const ManageShiftsDialog = ({
  userId,
  date,
  onChanged,
}: {
  userId: string;
  date: string;
  onChanged: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [empRes, shiftRes] = await Promise.all([
        supabase.from("employees").select("id, name").eq("user_id", userId).order("name"),
        supabase.from("employee_shifts").select("id, employee_id, start_time, end_time").eq("user_id", userId).eq("shift_date", date),
      ]);
      const emps = (empRes.data as Employee[]) || [];
      const shifts = shiftRes.data || [];
      setEmployees(emps);
      setRows(
        emps.map((e) => {
          const s = shifts.find((x: any) => x.employee_id === e.id);
          return {
            employee_id: e.id,
            on: !!s,
            start_time: s?.start_time?.slice(0, 5) || "09:00",
            end_time: s?.end_time?.slice(0, 5) || "17:00",
            shiftId: s?.id,
          };
        })
      );
    })();
  }, [open, userId, date]);

  const update = (idx: number, patch: Partial<ShiftRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        if (r.on) {
          if (r.shiftId) {
            await supabase
              .from("employee_shifts")
              .update({ start_time: r.start_time, end_time: r.end_time })
              .eq("id", r.shiftId);
          } else {
            await supabase.from("employee_shifts").insert({
              user_id: userId,
              employee_id: r.employee_id,
              shift_date: date,
              start_time: r.start_time,
              end_time: r.end_time,
            });
          }
        } else if (r.shiftId) {
          await supabase.from("employee_shifts").delete().eq("id", r.shiftId);
        }
      }
      toast({ title: "Shifts saved" });
      setOpen(false);
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
          <CalendarPlus size={16} /> Manage Shifts
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Shifts for {date}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pick which staff are working and set their hours.
          </DialogDescription>
        </DialogHeader>

        {employees.length === 0 ? (
          <p className="text-muted-foreground text-sm">Add employees first.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => {
              const emp = employees.find((e) => e.id === r.employee_id)!;
              return (
                <div key={r.employee_id} className="flex items-center gap-3 p-2 rounded border border-border">
                  <Checkbox checked={r.on} onCheckedChange={(v) => update(i, { on: !!v })} />
                  <span className="flex-1 text-foreground text-sm">{emp.name}</span>
                  <Input
                    type="time"
                    value={r.start_time}
                    disabled={!r.on}
                    onChange={(e) => update(i, { start_time: e.target.value })}
                    className="w-28 bg-secondary border-border"
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={r.end_time}
                    disabled={!r.on}
                    onChange={(e) => update(i, { end_time: e.target.value })}
                    className="w-28 bg-secondary border-border"
                  />
                </div>
              );
            })}
          </div>
        )}

        <Button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          {saving ? "Saving…" : "Save Shifts"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ManageShiftsDialog;
