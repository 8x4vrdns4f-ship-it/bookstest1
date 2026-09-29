import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const WEEKDAYS = [
  { v: 1, l: "Mon" }, { v: 2, l: "Tue" }, { v: 3, l: "Wed" }, { v: 4, l: "Thu" },
  { v: 5, l: "Fri" }, { v: 6, l: "Sat" }, { v: 0, l: "Sun" },
];

export type Schedule = {
  id?: string;
  employee_id: string;
  weekdays: number[];
  start_time: string;
  end_time: string;
  effective_from: string;
};

const today = () => new Date().toISOString().split("T")[0];

export const describeSchedule = (s?: Schedule | null) => {
  if (!s || !s.weekdays.length) return "No weekly schedule";
  const days = WEEKDAYS.filter((d) => s.weekdays.includes(d.v)).map((d) => d.l).join(", ");
  return `${days} · ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`;
};

const WeeklyScheduleEditor = ({
  userId,
  employeeId,
  onSaved,
}: {
  userId: string;
  employeeId: string;
  onSaved?: () => void;
}) => {
  const { toast } = useToast();
  const [existing, setExisting] = useState<Schedule | null>(null);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [when, setWhen] = useState<"today" | "date">("today");
  const [fromDate, setFromDate] = useState(today());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("employee_schedules")
        .select("id, employee_id, weekdays, start_time, end_time, effective_from")
        .eq("employee_id", employeeId)
        .maybeSingle();
      setExisting(data as Schedule | null);
      if (data) {
        setDays(data.weekdays);
        setStart(data.start_time.slice(0, 5));
        setEnd(data.end_time.slice(0, 5));
      }
    })();
  }, [employeeId]);

  const toggle = (v: number) =>
    setDays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));

  const save = async () => {
    if (!days.length) return toast({ title: "Pick at least one day", variant: "destructive" });
    if (end <= start) return toast({ title: "End time must be after start time", variant: "destructive" });
    setSaving(true);
    const from = when === "today" ? today() : fromDate;
    const { error } = await supabase.from("employee_schedules").upsert(
      { user_id: userId, employee_id: employeeId, weekdays: days, start_time: start, end_time: end, effective_from: from },
      { onConflict: "employee_id" },
    );
    if (!error) {
      const { error: e2 } = await supabase.rpc("apply_employee_schedule", { _employee_id: employeeId, _from: from, _replace: true });
      if (e2) { setSaving(false); return toast({ title: "Error", description: e2.message, variant: "destructive" }); }
    }
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Weekly schedule saved", description: `Shifts filled in from ${from}.` });
    setExisting({ employee_id: employeeId, weekdays: days, start_time: start, end_time: end, effective_from: from });
    onSaved?.();
  };

  const remove = async () => {
    setSaving(true);
    await supabase.from("employee_schedules").delete().eq("employee_id", employeeId);
    await supabase.rpc("apply_employee_schedule", { _employee_id: employeeId, _from: today(), _replace: true });
    setSaving(false);
    setExisting(null);
    toast({ title: "Weekly schedule removed", description: "Future automatic shifts were cleared." });
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Days they work</p>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d) => (
            <button
              key={d.v}
              type="button"
              onClick={() => toggle(d.v)}
              className={cn(
                "px-3 py-1.5 rounded-md border text-sm transition-colors",
                days.includes(d.v)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {d.l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Hours (used for every one of those days)</p>
        <div className="flex items-center gap-2">
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-28 bg-secondary border-border" />
          <span className="text-muted-foreground">–</span>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-28 bg-secondary border-border" />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Starts</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant={when === "today" ? "default" : "outline"} onClick={() => setWhen("today")}>From today</Button>
          <Button type="button" size="sm" variant={when === "date" ? "default" : "outline"} onClick={() => setWhen("date")}>From a date</Button>
          {when === "date" && (
            <Input type="date" min={today()} value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-auto bg-secondary border-border" />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Shifts are filled in automatically about 12 weeks ahead. Days you've changed by hand are kept.
      </p>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Saving…" : "Save weekly schedule"}</Button>
        {existing && <Button variant="outline" onClick={remove} disabled={saving}>Remove</Button>}
      </div>
    </div>
  );
};

export default WeeklyScheduleEditor;
