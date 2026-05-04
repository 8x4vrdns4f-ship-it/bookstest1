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

  const { inProgress, free, unavailable } = useMemo(() => {
    void tick;
    const isToday = date === todayStr();
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const onShift = new Set(shifts.map((s) => s.employee_id));
    const working = employees.filter((e) => onShift.has(e.id));

    const groups = { inProgress: [] as StaffMember[], free: [] as StaffMember[], unavailable: [] as StaffMember[] };

    for (const emp of working) {
      // check if currently in a booking
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
            onClick={() => setSelected(m)}
            className="bg-card border-border cursor-pointer hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-4">
              <p className="font-medium text-foreground">{m.name}</p>
              {m.position && <p className="text-xs text-muted-foreground">{m.position}</p>}
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
          <p className="text-sm text-muted-foreground">Click any staff member to assign bookings or change status.</p>
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
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No staff yet. Add your first team member to get started.
          </CardContent>
        </Card>
      ) : shifts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No staff scheduled for this day. Click <strong className="text-foreground">Manage Shifts</strong> to add some.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          <Column title="In Progress" icon={Activity} color="text-primary" items={inProgress} />
          <Column title="Free" icon={CheckCircle2} color="text-emerald-400" items={free} />
          <Column title="Unavailable" icon={AlertCircle} color="text-destructive" items={unavailable} />
        </div>
      )}

      <EmployeeActionsDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        employee={selected}
        userId={userId}
        date={date}
        onChanged={load}
      />
    </div>
  );
};

export default StaffList;
