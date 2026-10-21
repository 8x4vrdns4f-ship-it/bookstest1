import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimeField } from "@/components/ui/date-time-fields";
import SectionCard from "@/components/app/SectionCard";
import EmptyState from "@/components/app/EmptyState";
import ListSkeleton from "@/components/app/ListSkeleton";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, ChevronLeft, ChevronRight, Repeat, Info, Pencil } from "lucide-react";
import { addDays, format, parseISO, startOfWeek, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import AddEmployeeDialog from "./AddEmployeeDialog";
import WeeklyScheduleEditor, { Schedule, WEEKDAYS } from "./WeeklyScheduleEditor";

interface Employee { id: string; name: string; position: string | null }
interface Shift { id: string; employee_id: string; shift_date: string; start_time: string; end_time: string; is_override: boolean }
interface TimeOff { employee_id: string; start_date: string; end_date: string }
type DayHours = { open: string; close: string; closed: boolean };

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const todayStr = () => ymd(new Date());
const hrs = (s: string, e: string) => {
  const [a, b] = s.split(":").map(Number); const [c, d] = e.split(":").map(Number);
  return Math.max(0, (c * 60 + d - (a * 60 + b)) / 60);
};
const fmtH = (n: number) => (Number.isInteger(n) ? `${n}h` : `${n.toFixed(1)}h`);
const short = (t: string) => t.slice(0, 5).replace(/^0/, "").replace(":00", "");

export const describeUsualWeek = (s?: Schedule | null) => {
  if (!s || !s.weekdays.length) return "No usual week set";
  const days = WEEKDAYS.filter((d) => s.weekdays.includes(d.v)).map((d) => d.l).join(", ");
  const weekly = hrs(s.start_time, s.end_time) * s.weekdays.length;
  return `${days} · ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)} · ${fmtH(weekly)}/week`;
};

const ShiftsView = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({});
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [hours, setHours] = useState<Record<string, DayHours> | null>(null);
  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [usualFor, setUsualFor] = useState<Employee | null>(null);
  const [cell, setCell] = useState<{ emp: Employee; date: string } | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const from = ymd(days[0]); const to = ymd(days[6]);

  useEffect(() => {
    (async () => {
      await supabase.rpc("extend_business_schedules", { _user_id: userId });
      setReady(true);
    })();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const [emp, sh, sc, to_, bs, ov] = await Promise.all([
      supabase.from("employees").select("id, name, position").eq("user_id", userId).order("name"),
      supabase.from("employee_shifts").select("id, employee_id, shift_date, start_time, end_time, is_override").eq("user_id", userId).gte("shift_date", from).lte("shift_date", to),
      supabase.from("employee_schedules").select("id, employee_id, weekdays, start_time, end_time, effective_from").eq("user_id", userId),
      supabase.from("time_off_requests").select("employee_id, start_date, end_date").eq("user_id", userId).eq("status", "approved").lte("start_date", to).gte("end_date", from),
      supabase.from("business_settings").select("working_hours").eq("user_id", userId).maybeSingle(),
      supabase.from("date_overrides").select("override_date, closed").eq("user_id", userId).gte("override_date", from).lte("override_date", to),
    ]);
    setEmployees((emp.data as Employee[]) || []);
    setShifts((sh.data as Shift[]) || []);
    const m: Record<string, Schedule> = {};
    (sc.data || []).forEach((s) => { m[s.employee_id] = s as Schedule; });
    setSchedules(m);
    setTimeOff((to_.data as TimeOff[]) || []);
    setHours((bs.data?.working_hours as unknown as Record<string, DayHours>) || null);
    setClosedDates(new Set((ov.data || []).filter((o) => o.closed).map((o) => o.override_date)));
    setLoading(false);
  };

  useEffect(() => { if (ready) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready, from, userId]);

  const isClosed = (d: Date) => closedDates.has(ymd(d)) || !!hours?.[DAY_KEYS[d.getDay()]]?.closed;
  const shiftFor = (empId: string, date: string) => shifts.find((s) => s.employee_id === empId && s.shift_date === date);
  const onLeave = (empId: string, date: string) => timeOff.some((t) => t.employee_id === empId && t.start_date <= date && t.end_date >= date);

  const noSchedules = employees.length > 0 && Object.keys(schedules).length === 0;
  const weekLabel = `${format(days[0], "d MMM")} – ${format(days[6], "d MMM yyyy")}`;
  const isThisWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-5">
      {noSchedules && (
        <SectionCard bodyClassName="p-4">
          <div className="flex gap-3">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">How shifts work</p>
              <ol className="list-decimal pl-4 text-muted-foreground space-y-1">
                <li>Give each person a <span className="text-foreground">usual week</span> — the days and hours they normally work.</li>
                <li>We fill in their shifts automatically, about 12 weeks ahead.</li>
                <li>Need a one-off change? Click any day in the grid below to change just that day.</li>
              </ol>
              <Button size="sm" onClick={() => setUsualFor(employees[0])} className="gap-1.5 mt-1">
                <Repeat size={14} /> Set up {employees[0].name}'s usual week
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { n: 1, t: "Set usual week", d: "Press “Set usual week” by a name, pick their days and hours, then Save." },
          { n: 2, t: "It repeats every week", d: "Their shifts fill in automatically, with no end date." },
          { n: 3, t: "Change just one day", d: "Click any day in the grid for a one-off change. Their usual week stays the same." },
        ].map((s) => (
          <div key={s.n} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
            <span className="shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{s.n}</span>
            <div><p className="text-sm font-medium text-foreground">{s.t}</p><p className="text-xs text-muted-foreground">{s.d}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week"><ChevronLeft size={16} /></Button>
        <Button variant={isThisWeek ? "default" : "outline"} size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This week</Button>
        <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week"><ChevronRight size={16} /></Button>
        <span className="text-sm font-medium text-foreground ml-1">{weekLabel}</span>
        <div className="ml-auto"><AddEmployeeDialog userId={userId} onEmployeeAdded={load} /></div>
      </div>

      {!ready || (loading && employees.length === 0) ? (
        <ListSkeleton rows={4} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="No staff yet"
          description="Add your first team member, then give them a usual week."
          action={<AddEmployeeDialog userId={userId} onEmployeeAdded={load} />}
        />
      ) : (
        <SectionCard bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px] border-collapse">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-card text-left font-medium p-3 w-52">Team member</th>
                  {days.map((d) => {
                    const today = ymd(d) === todayStr();
                    return (
                      <th key={ymd(d)} className={cn("font-medium p-2 text-center", today && "text-primary")}>
                        <div>{format(d, "EEE")}</div>
                        <div className={cn("text-foreground text-sm", today && "text-primary")}>{format(d, "d MMM")}</div>
                        {isClosed(d) && <div className="text-[10px] text-muted-foreground">Closed</div>}
                      </th>
                    );
                  })}
                  <th className="font-medium p-2 text-right pr-3">Week</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  let total = 0;
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="sticky left-0 z-10 bg-card p-3 align-top">
                        <p className="text-foreground font-medium truncate">{e.name}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{describeUsualWeek(schedules[e.id])}</p>
                        {schedules[e.id] && (
                          <p className="text-[11px] text-primary/80 leading-snug">Repeats weekly from {format(parseISO(schedules[e.id].effective_from), "d MMM")}</p>
                        )}
                        <button type="button" onClick={() => setUsualFor(e)} className="text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1">
                          <Repeat size={11} /> {schedules[e.id] ? "Change usual week" : "Set usual week"}
                        </button>
                      </td>
                      {days.map((d) => {
                        const date = ymd(d);
                        const s = shiftFor(e.id, date);
                        const leave = onLeave(e.id, date);
                        if (s) total += hrs(s.start_time.slice(0, 5), s.end_time.slice(0, 5));
                        return (
                          <td key={date} className="p-1.5">
                            <button
                              type="button"
                              onClick={() => setCell({ emp: e, date })}
                              title={s?.is_override ? "One-off change" : undefined}
                              className={cn(
                                "w-full min-h-[52px] rounded-md border text-xs px-1 py-1.5 transition-colors relative group",
                                leave ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                                  : s ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20"
                                  : "border-dashed border-border text-muted-foreground hover:bg-secondary/60",
                              )}
                            >
                              {leave ? "Holiday" : s ? (
                                <>
                                  <span className="font-semibold">{short(s.start_time)}–{short(s.end_time)}</span>
                                  {s.is_override && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400" />}
                                </>
                              ) : (
                                <span>Off</span>
                              )}
                              <Pencil size={10} className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60" />
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-2 pr-3 text-right text-foreground font-medium">{fmtH(total)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border text-xs text-muted-foreground">
                  <td className="sticky left-0 z-10 bg-card p-3">People working</td>
                  {days.map((d) => {
                    const n = employees.filter((e) => shiftFor(e.id, ymd(d)) && !onLeave(e.id, ymd(d))).length;
                    return <td key={ymd(d)} className={cn("text-center p-2", n === 0 && !isClosed(d) && "text-amber-400")}>{n}</td>;
                  })}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-primary/40" /> Working</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> One-off change</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-400/30" /> Holiday</span>
            <span>Click any day to change it.</span>
          </div>
        </SectionCard>
      )}

      <Dialog open={!!usualFor} onOpenChange={(o) => !o && setUsualFor(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{usualFor?.name}'s usual week</DialogTitle>
            <DialogDescription>The days and hours they normally work. We'll fill in their shifts for you.</DialogDescription>
          </DialogHeader>
          {usualFor && (
            <WeeklyScheduleEditor userId={userId} employeeId={usualFor.id} onSaved={() => { setUsualFor(null); load(); }} />
          )}
        </DialogContent>
      </Dialog>

      {cell && (
        <ShiftCellDialog
          userId={userId}
          emp={cell.emp}
          date={cell.date}
          shift={shiftFor(cell.emp.id, cell.date)}
          schedule={schedules[cell.emp.id]}
          onClose={() => setCell(null)}
          onSaved={() => { setCell(null); load(); toast({ title: "Shift updated" }); }}
        />
      )}
    </div>
  );
};

function ShiftCellDialog({ userId, emp, date, shift, schedule, onClose, onSaved }: {
  userId: string; emp: Employee; date: string; shift?: Shift; schedule?: Schedule;
  onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [on, setOn] = useState(!!shift);
  const [start, setStart] = useState(shift?.start_time.slice(0, 5) || schedule?.start_time.slice(0, 5) || "09:00");
  const [end, setEnd] = useState(shift?.end_time.slice(0, 5) || schedule?.end_time.slice(0, 5) || "17:00");
  const [makeUsual, setMakeUsual] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (on && end <= start) return toast({ title: "End time must be after start time", variant: "destructive" });
    setSaving(true);
    try {
      if (on) {
        await supabase.from("employee_shift_skips").delete().eq("employee_id", emp.id).eq("skip_date", date);
        if (shift) {
          const { error } = await supabase.from("employee_shifts").update({ start_time: start, end_time: end, is_override: !makeUsual }).eq("id", shift.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("employee_shifts").insert({ user_id: userId, employee_id: emp.id, shift_date: date, start_time: start, end_time: end, is_override: true });
          if (error) throw error;
        }
        if (makeUsual && schedule) {
          await supabase.from("employee_schedules").update({ start_time: start, end_time: end }).eq("employee_id", emp.id);
          await supabase.rpc("apply_employee_schedule", { _employee_id: emp.id, _from: todayStr(), _replace: true });
        }
      } else if (shift) {
        await supabase.from("employee_shifts").delete().eq("id", shift.id);
        await supabase.from("employee_shift_skips").upsert({ user_id: userId, employee_id: emp.id, skip_date: date }, { onConflict: "employee_id,skip_date" });
      }
      onSaved();
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle>{emp.name} · {format(parseISO(date), "EEE d MMM")}</DialogTitle>
          <DialogDescription>Change just this day. Their usual week stays the same.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="cell-on" className="text-foreground">Working this day</Label>
            <Switch id="cell-on" checked={on} onCheckedChange={setOn} />
          </div>
          {on && (
            <div className="flex items-center gap-2">
              <TimeField value={start} onChange={(e) => setStart(e.target.value)} />
              <span className="text-muted-foreground">to</span>
              <TimeField value={end} onChange={(e) => setEnd(e.target.value)} />
              <span className="text-xs text-muted-foreground ml-auto">{fmtH(hrs(start, end))}</span>
            </div>
          )}
          {on && schedule && (
            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={makeUsual} onCheckedChange={(v) => setMakeUsual(!!v)} className="mt-0.5" />
              Make these their usual hours on every working day from today
            </label>
          )}
          {shift?.is_override && <p className="text-[11px] text-amber-400">This day is already a one-off change.</p>}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShiftsView;
