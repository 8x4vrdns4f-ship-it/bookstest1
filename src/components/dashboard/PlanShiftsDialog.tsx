import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
}

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const PlanShiftsDialog = ({
  userId,
  onChanged,
}: {
  userId: string;
  onChanged: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [originalKeys, setOriginalKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load employees when opened
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", userId)
        .order("name");
      const emps = (data as Employee[]) || [];
      setEmployees(emps);
      if (emps.length && !employeeId) setEmployeeId(emps[0].id);
    })();
  }, [open, userId]);

  // Load shifts for chosen employee (today and forward)
  useEffect(() => {
    if (!open || !employeeId) return;
    (async () => {
      setLoading(true);
      const today = fmt(new Date());
      const { data } = await supabase
        .from("employee_shifts")
        .select("shift_date")
        .eq("user_id", userId)
        .eq("employee_id", employeeId)
        .gte("shift_date", today);
      const keys = new Set<string>((data || []).map((r: any) => r.shift_date));
      setOriginalKeys(keys);
      setSelectedDates(Array.from(keys).map((k) => new Date(k + "T00:00:00")));
      setLoading(false);
    })();
  }, [open, employeeId, userId]);

  const selectedKeys = useMemo(
    () => new Set(selectedDates.map(fmt)),
    [selectedDates]
  );

  const { toAdd, toRemove } = useMemo(() => {
    const add: string[] = [];
    const remove: string[] = [];
    selectedKeys.forEach((k) => {
      if (!originalKeys.has(k)) add.push(k);
    });
    originalKeys.forEach((k) => {
      if (!selectedKeys.has(k)) remove.push(k);
    });
    return { toAdd: add, toRemove: remove };
  }, [selectedKeys, originalKeys]);

  const save = async () => {
    if (!employeeId) return;
    setSaving(true);
    try {
      if (toAdd.length) {
        const rows = toAdd.map((d) => ({
          user_id: userId,
          employee_id: employeeId,
          shift_date: d,
          start_time: "09:00",
          end_time: "17:00",
        }));
        const { error } = await supabase.from("employee_shifts").insert(rows);
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase
          .from("employee_shifts")
          .delete()
          .eq("user_id", userId)
          .eq("employee_id", employeeId)
          .in("shift_date", toRemove);
        if (error) throw error;
      }
      toast({
        title: "Schedule saved",
        description: `${toAdd.length} added, ${toRemove.length} removed.`,
      });
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
        <Button
          variant="outline"
          className="gap-2 border-border text-muted-foreground hover:text-foreground"
        >
          <CalendarRange size={16} /> Plan Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Plan ahead</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pick an employee, then click each day they'll be working. Default hours 09:00–17:00 (edit per-day in Manage Shifts).
          </DialogDescription>
        </DialogHeader>

        {employees.length === 0 ? (
          <p className="text-muted-foreground text-sm">Add employees first.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Employee</label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-border bg-secondary/30 flex justify-center">
              {loading ? (
                <p className="text-muted-foreground text-sm py-8">Loading…</p>
              ) : (
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  disabled={(d) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return d < today;
                  }}
                  className={cn("p-3 pointer-events-auto")}
                />
              )}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{selectedDates.length} day(s) selected</span>
              <span>
                +{toAdd.length} / −{toRemove.length}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={save}
          disabled={saving || !employeeId || (toAdd.length === 0 && toRemove.length === 0)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {saving ? "Saving…" : "Save Schedule"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PlanShiftsDialog;
