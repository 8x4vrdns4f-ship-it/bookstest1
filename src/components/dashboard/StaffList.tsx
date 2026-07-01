import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AddEmployeeDialog from "./AddEmployeeDialog";
import ManageShiftsDialog from "./ManageShiftsDialog";
import PlanShiftsDialog from "./PlanShiftsDialog";
import EmployeeActionsDialog, { type StaffMember, type DerivedStatus } from "./EmployeeActionsDialog";
import EmployeeProfileDialog from "./EmployeeProfileDialog";
import { CheckCircle2, AlertCircle, Activity, Clock, User } from "lucide-react";
import EmptyState from "@/components/app/EmptyState";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  manual_status: string | null;
  manual_status_date: string | null;
}

interface Shift {
  employee_id: string;
  start_time: string;
  end_time: string;
}

interface BookingSlot {
  assigned_employee_id: string | null;
  booking_time: string;
  duration_minutes: number;
  status: string;
}

const todayStr = () => new Date().toISOString().split("T")[0];

const StaffList = ({ userId }: { userId: string }) => {
  const [date, setDate] = useState<string>(todayStr());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // re-evaluate "in progress" every minute
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    setLoading(true);
    const [empRes, shiftRes, bkRes] = await Promise.all([
      supabase
        .from("employees")
        .select("id, name, email, phone, position, manual_status, manual_status_date")
        .eq("user_id", userId)
        .order("name"),
      supabase
        .from("employee_shifts")
        .select("employee_id, start_time, end_time")
        .eq("user_id", userId)
        .eq("shift_date", date),
      supabase
        .from("bookings")
        .select("assigned_employee_id, booking_time, duration_minutes, status")
        .eq("user_id", userId)
        .eq("booking_date", date),
    ]);
    setEmployees((empRes.data as Employee[]) || []);
    setShifts((shiftRes.data as Shift[]) || []);
    setBookings((bkRes.data as BookingSlot[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId, date]);

  const { inProgress, free, unavailable, onShiftNow } = useMemo(() => {
    void tick;
    const isToday = date === todayStr();
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const shiftByEmp = new Map(shifts.map((s) => [s.employee_id, s]));
    const working = employees.filter((e) => shiftByEmp.has(e.id));

    const groups = {
      inProgress: [] as StaffMember[],
      free: [] as StaffMember[],
      unavailable: [] as StaffMember[],
      onShiftNow: [] as Array<StaffMember & { shiftStart: string; shiftEnd: string }>,
    };

    for (const emp of working) {
      const shift = shiftByEmp.get(emp.id)!;

      // Currently within shift window?
      let withinShift = false;
      if (isToday) {
        const [sh, sm] = shift.start_time.split(":").map(Number);
        const [eh, em] = shift.end_time.split(":").map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        withinShift = nowMins >= start && nowMins < end;
      }

      // Currently in a booking?
      let activeNow = false;
      if (isToday) {
        for (const b of bookings) {
          if (b.assigned_employee_id !== emp.id) continue;
          if (!["confirmed", "in_progress", "pending"].includes(b.status)) continue;
          const [h, m] = b.booking_time.split(":").map(Number);
          const start = h * 60 + m;
          const end = start + (b.duration_minutes || 60);
          if (nowMins >= start && nowMins < end) {
            activeNow = true;
            break;
          }
        }
      }

      const manualValid = emp.manual_status && emp.manual_status_date === date;
      let status: DerivedStatus;
      if (activeNow) status = "in_progress";
      else if (manualValid) status = emp.manual_status as DerivedStatus;
      else status = "free";

      const member: StaffMember = {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        position: emp.position,
        manual_status: manualValid ? emp.manual_status : null,
        status,
      };
      groups[status === "in_progress" ? "inProgress" : status].push(member);

      if (withinShift && status !== "unavailable") {
        groups.onShiftNow.push({
          ...member,
          shiftStart: shift.start_time.slice(0, 5),
          shiftEnd: shift.end_time.slice(0, 5),
        });
      }
    }
    return groups;
  }, [employees, shifts, bookings, date, tick]);

  const Column = ({
    title,
    icon: Icon,
    color,
    items,
  }: {
    title: string;
    icon: typeof Activity;
    color: string;
    items: StaffMember[];
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className={color} />
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-6 text-center text-xs text-muted-foreground">No one here</CardContent>
        </Card>
      ) : (
        items.map((m) => (
          <Card
            key={m.id}
            className="bg-card border-border hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between gap-2">
              <button
                onClick={() => setProfileId(m.id)}
                className="text-left flex-1 min-w-0"
              >
                <p className="font-medium text-foreground truncate">{m.name}</p>
                {m.position && <p className="text-xs text-muted-foreground truncate">{m.position}</p>}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(m); }}
                className="text-xs text-primary hover:underline shrink-0"
              >
                Assign
              </button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Staff on duty</h2>
          <p className="text-sm text-muted-foreground">Click a name to view their profile, or use the columns below to assign bookings.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-secondary border-border w-auto"
          />
          <ManageShiftsDialog userId={userId} date={date} onChanged={load} />
          <PlanShiftsDialog userId={userId} onChanged={load} />
          <AddEmployeeDialog userId={userId} onEmployeeAdded={load} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<User size={20} />}
          title="No staff yet"
          description="Add your first team member to start scheduling shifts and assigning bookings."
        />
      ) : shifts.length === 0 ? (
        <EmptyState
          icon={<Clock size={20} />}
          title="No shifts scheduled"
          description="Click Manage Shifts to add staff to this day."
        />
      ) : (
        <>
          {/* On shift now (today only) */}
          {date === todayStr() && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-primary" />
                  <h3 className="font-semibold text-foreground">On shift now</h3>
                  <span className="text-xs text-muted-foreground">({onShiftNow.length})</span>
                </div>
                {onShiftNow.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Nobody is currently within their shift hours.</p>
                ) : (
                  <div className="space-y-2">
                    {onShiftNow.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setProfileId(m.id)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded border border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                            <User size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                            {m.position && <p className="text-xs text-muted-foreground truncate">{m.position}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-foreground">{m.shiftStart} – {m.shiftEnd}</p>
                          <p className={`text-[10px] uppercase tracking-wide ${m.status === "in_progress" ? "text-primary" : "text-emerald-400"}`}>
                            {m.status === "in_progress" ? "In booking" : "Free"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            <Column title="In Progress" icon={Activity} color="text-primary" items={inProgress} />
            <Column title="Free" icon={CheckCircle2} color="text-emerald-400" items={free} />
            <Column title="Unavailable" icon={AlertCircle} color="text-destructive" items={unavailable} />
          </div>
        </>
      )}

      <EmployeeActionsDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        employee={selected}
        userId={userId}
        date={date}
        onChanged={load}
      />

      <EmployeeProfileDialog
        open={!!profileId}
        onOpenChange={(v) => !v && setProfileId(null)}
        employeeId={profileId}
        userId={userId}
      />
    </div>
  );
};

export default StaffList;
