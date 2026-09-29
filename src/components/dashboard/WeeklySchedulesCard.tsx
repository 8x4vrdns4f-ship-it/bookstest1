import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import WeeklyScheduleEditor, { Schedule, WEEKDAYS } from "./WeeklyScheduleEditor";

type Emp = { id: string; name: string };

const WeeklySchedulesCard = ({ userId, employees, onChanged }: { userId: string; employees: Emp[]; onChanged: () => void }) => {
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({});
  const [editing, setEditing] = useState<Emp | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("employee_schedules")
      .select("id, employee_id, weekdays, start_time, end_time, effective_from")
      .eq("user_id", userId);
    const m: Record<string, Schedule> = {};
    (data || []).forEach((s) => { m[s.employee_id] = s as Schedule; });
    setSchedules(m);
  };

  useEffect(() => { load(); }, [userId]);

  if (!employees.length) return null;

  return (
    <SectionCard title="Weekly schedules" bodyClassName="p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium py-1">Employee</th>
              {WEEKDAYS.map((d) => <th key={d.v} className="font-medium py-1 w-10">{d.l}</th>)}
              <th className="text-left font-medium py-1">Hours</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const s = schedules[e.id];
              return (
                <tr key={e.id} className="border-t border-border">
                  <td className="py-2 text-foreground">{e.name}</td>
                  {WEEKDAYS.map((d) => (
                    <td key={d.v} className="text-center">
                      <span className={cn("inline-block h-2.5 w-2.5 rounded-full", s?.weekdays.includes(d.v) ? "bg-primary" : "bg-muted")} />
                    </td>
                  ))}
                  <td className="text-muted-foreground">{s ? `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}` : "Not set"}</td>
                  <td className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(e)} className="gap-1">
                      <Repeat size={14} /> {s ? "Edit" : "Set"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Weekly schedule — {editing?.name}</DialogTitle>
            <DialogDescription>Set the days they always work and their usual hours.</DialogDescription>
          </DialogHeader>
          {editing && (
            <WeeklyScheduleEditor
              userId={userId}
              employeeId={editing.id}
              onSaved={() => { setEditing(null); load(); onChanged(); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
};

export default WeeklySchedulesCard;
