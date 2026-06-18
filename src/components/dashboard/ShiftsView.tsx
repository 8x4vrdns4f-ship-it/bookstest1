import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Save } from "lucide-react";
import PlanShiftsDialog from "./PlanShiftsDialog";
import AddEmployeeDialog from "./AddEmployeeDialog";

interface Employee {
  id: string;
  name: string;
  position: string | null;
}

interface ShiftRow {
  employee_id: string;
  on: boolean;
  start_time: string;
  end_time: string;
  shiftId?: string;
}

const todayStr = () => new Date().toISOString().split("T")[0];

const ShiftsView = ({ userId }: { userId: string }) => {
  const [date, setDate] = useState<string>(todayStr());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [empRes, shiftRes] = await Promise.all([
      supabase
        .from("employees")
        .select("id, name, position")
        .eq("user_id", userId)
        .order("name"),
      supabase
        .from("employee_shifts")
        .select("id, employee_id, start_time, end_time")
        .eq("user_id", userId)
        .eq("shift_date", date),
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
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId, date]);

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
      toast({ title: "Shifts saved", description: `Updated shifts for ${date}.` });
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" /> Shifts
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a date, tick who's working and set their hours. Use Plan Schedule to roll out multiple days at once.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-secondary border-border w-auto"
          />
          <PlanShiftsDialog userId={userId} onChanged={load} />
          <AddEmployeeDialog userId={userId} onEmployeeAdded={load} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : employees.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No staff yet. Add your first team member to start scheduling shifts.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-2">
              {rows.map((r, i) => {
                const emp = employees.find((e) => e.id === r.employee_id)!;
                return (
                  <div
                    key={r.employee_id}
                    className="flex items-center gap-3 p-3 rounded border border-border bg-secondary/30"
                  >
                    <Checkbox
                      checked={r.on}
                      onCheckedChange={(v) => update(i, { on: !!v })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                      {emp.position && (
                        <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                      )}
                    </div>
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
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button
              onClick={save}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
            >
              <Save size={16} />
              {saving ? "Saving…" : `Save shifts for ${date}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShiftsView;
