import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { addDays, eachDayOfInterval, format, parseISO } from "date-fns";
import PlanShiftsDialog from "./PlanShiftsDialog";
import AddEmployeeDialog from "./AddEmployeeDialog";

interface Employee {
  id: string;
  name: string;
  position: string | null;
}

interface DayRow {
  date: string; // yyyy-MM-dd
  on: boolean;
  start_time: string;
  end_time: string;
  shiftId?: string;
  // snapshot of initial state to detect changes
  initial: { on: boolean; start_time: string; end_time: string; shiftId?: string };
}

type RangePreset = "1w" | "2w" | "4w" | "custom";

const todayStr = () => new Date().toISOString().split("T")[0];

const presetDays: Record<Exclude<RangePreset, "custom">, number> = {
  "1w": 7,
  "2w": 14,
  "4w": 28,
};

const ShiftsView = ({ userId }: { userId: string }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [preset, setPreset] = useState<RangePreset>("1w");
  const [from, setFrom] = useState<string>(todayStr());
  const [to, setTo] = useState<string>(
    format(addDays(new Date(), 6), "yyyy-MM-dd")
  );
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load employee list once
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, name, position")
        .eq("user_id", userId)
        .order("name");
      const emps = (data as Employee[]) || [];
      setEmployees(emps);
      if (emps.length && !employeeId) setEmployeeId(emps[0].id);
      if (!emps.length) setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const dateList = useMemo(() => {
    try {
      const start = parseISO(from);
      const end = parseISO(to);
      if (end < start) return [] as string[];
      return eachDayOfInterval({ start, end }).map((d) =>
        format(d, "yyyy-MM-dd")
      );
    } catch {
      return [] as string[];
    }
  }, [from, to]);

  const load = async () => {
    if (!employeeId || dateList.length === 0) return;
    setLoading(true);
    const { data } = await supabase
      .from("employee_shifts")
      .select("id, shift_date, start_time, end_time")
      .eq("user_id", userId)
      .eq("employee_id", employeeId)
      .gte("shift_date", dateList[0])
      .lte("shift_date", dateList[dateList.length - 1]);
    const shifts = data || [];
    setRows(
      dateList.map((d) => {
        const s = shifts.find((x: any) => x.shift_date === d);
        const on = !!s;
        const start_time = s?.start_time?.slice(0, 5) || "09:00";
        const end_time = s?.end_time?.slice(0, 5) || "17:00";
        return {
          date: d,
          on,
          start_time,
          end_time,
          shiftId: s?.id,
          initial: { on, start_time, end_time, shiftId: s?.id },
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, from, to]);

  const update = (idx: number, patch: Partial<DayRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const shiftWindow = (dir: 1 | -1) => {
    if (preset === "custom") {
      const len = dateList.length || 7;
      setFrom(format(addDays(parseISO(from), dir * len), "yyyy-MM-dd"));
      setTo(format(addDays(parseISO(to), dir * len), "yyyy-MM-dd"));
    } else {
      const len = presetDays[preset];
      setFrom(format(addDays(parseISO(from), dir * len), "yyyy-MM-dd"));
      setTo(format(addDays(parseISO(from), dir * len + len - 1), "yyyy-MM-dd"));
    }
  };

  const onPresetChange = (val: RangePreset) => {
    setPreset(val);
    if (val !== "custom") {
      const start = parseISO(from);
      setTo(format(addDays(start, presetDays[val] - 1), "yyyy-MM-dd"));
    }
  };

  const save = async () => {
    if (!employeeId) return;
    setSaving(true);
    try {
      for (const r of rows) {
        const changed =
          r.on !== r.initial.on ||
          r.start_time !== r.initial.start_time ||
          r.end_time !== r.initial.end_time;
        if (!changed) continue;

        if (r.on) {
          if (r.shiftId) {
            await supabase
              .from("employee_shifts")
              .update({ start_time: r.start_time, end_time: r.end_time })
              .eq("id", r.shiftId);
          } else {
            await supabase.from("employee_shifts").insert({
              user_id: userId,
              employee_id: employeeId,
              shift_date: r.date,
              start_time: r.start_time,
              end_time: r.end_time,
            });
          }
        } else if (r.shiftId) {
          await supabase.from("employee_shifts").delete().eq("id", r.shiftId);
        }
      }
      const emp = employees.find((e) => e.id === employeeId);
      toast({
        title: "Shifts saved",
        description: `Updated shifts for ${emp?.name ?? "employee"}.`,
      });
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const reloadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, name, position")
      .eq("user_id", userId)
      .order("name");
    const emps = (data as Employee[]) || [];
    setEmployees(emps);
    if (emps.length && !emps.find((e) => e.id === employeeId)) {
      setEmployeeId(emps[0].id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" /> Shifts
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a person, then toggle each day on or off and set their hours individually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={preset} onValueChange={(v) => onPresetChange(v as RangePreset)}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1w">1 week</SelectItem>
              <SelectItem value="2w">2 weeks</SelectItem>
              <SelectItem value="4w">4 weeks</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => shiftWindow(-1)} aria-label="Previous">
            <ChevronLeft size={16} />
          </Button>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              if (preset !== "custom") {
                setTo(
                  format(
                    addDays(parseISO(e.target.value), presetDays[preset] - 1),
                    "yyyy-MM-dd"
                  )
                );
              }
            }}
            className="bg-secondary border-border w-auto"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPreset("custom");
            }}
            className="bg-secondary border-border w-auto"
          />
          <Button variant="outline" size="icon" onClick={() => shiftWindow(1)} aria-label="Next">
            <ChevronRight size={16} />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <PlanShiftsDialog userId={userId} onChanged={load} />
            <AddEmployeeDialog userId={userId} onEmployeeAdded={reloadEmployees} />
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No staff yet. Add your first team member to start scheduling shifts.
          </CardContent>
        </Card>
      ) : loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <>
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-2">
              {rows.map((r, i) => (
                <div
                  key={r.date}
                  className="flex items-center gap-3 p-3 rounded border border-border bg-secondary/30"
                >
                  <Checkbox
                    checked={r.on}
                    onCheckedChange={(v) => update(i, { on: !!v })}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(r.date), "EEE d MMM")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.on ? "Working" : "Off"}
                    </p>
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
              ))}
              {rows.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">
                  Select a valid date range.
                </p>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button
              onClick={save}
              disabled={saving || !employeeId}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
            >
              <Save size={16} />
              {saving
                ? "Saving…"
                : `Save shifts for ${selectedEmployee?.name ?? "employee"}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShiftsView;
