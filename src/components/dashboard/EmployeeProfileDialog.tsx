import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Briefcase, CheckCircle2, Clock, CalendarDays, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string | null;
  userId: string;
}

interface EmpDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  auth_user_id: string | null;
  created_at: string;
}

interface Shift {
  shift_date: string;
  start_time: string;
  end_time: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  client_name: string;
  service: string;
  status: string;
}

const todayStr = () => new Date().toISOString().split("T")[0];

const EmployeeProfileDialog = ({ open, onOpenChange, employeeId, userId }: Props) => {
  const [emp, setEmp] = useState<EmpDetails | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ completed: 0, hoursWeek: 0, hoursMonth: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !employeeId) return;
    (async () => {
      setLoading(true);
      const today = todayStr();

      // Range for week/month stats
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [empRes, shiftsRes, bkRes, completedRes, weekShiftsRes, monthShiftsRes] = await Promise.all([
        supabase
          .from("employees")
          .select("id, name, email, phone, position, auth_user_id, created_at")
          .eq("id", employeeId)
          .maybeSingle(),
        supabase
          .from("employee_shifts")
          .select("shift_date, start_time, end_time")
          .eq("user_id", userId)
          .eq("employee_id", employeeId)
          .gte("shift_date", today)
          .order("shift_date", { ascending: true })
          .limit(20),
        supabase
          .from("bookings")
          .select("id, booking_date, booking_time, duration_minutes, client_name, service, status")
          .eq("user_id", userId)
          .eq("assigned_employee_id", employeeId)
          .gte("booking_date", today)
          .in("status", ["pending", "confirmed", "in_progress"])
          .order("booking_date", { ascending: true })
          .order("booking_time", { ascending: true })
          .limit(20),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("assigned_employee_id", employeeId)
          .eq("status", "completed"),
        supabase
          .from("employee_shifts")
          .select("start_time, end_time, shift_date")
          .eq("user_id", userId)
          .eq("employee_id", employeeId)
          .gte("shift_date", weekStart.toISOString().split("T")[0])
          .lte("shift_date", today),
        supabase
          .from("employee_shifts")
          .select("start_time, end_time, shift_date")
          .eq("user_id", userId)
          .eq("employee_id", employeeId)
          .gte("shift_date", monthStart.toISOString().split("T")[0])
          .lte("shift_date", today),
      ]);

      setEmp((empRes.data as EmpDetails) || null);
      setUpcomingShifts((shiftsRes.data as Shift[]) || []);
      setUpcomingBookings((bkRes.data as Booking[]) || []);

      const sumHours = (rows: any[]) =>
        (rows || []).reduce((acc, r) => {
          const [sh, sm] = r.start_time.split(":").map(Number);
          const [eh, em] = r.end_time.split(":").map(Number);
          return acc + Math.max(0, eh * 60 + em - (sh * 60 + sm)) / 60;
        }, 0);

      setStats({
        completed: completedRes.count || 0,
        hoursWeek: Math.round(sumHours(weekShiftsRes.data || []) * 10) / 10,
        hoursMonth: Math.round(sumHours(monthShiftsRes.data || []) * 10) / 10,
      });
      setLoading(false);
    })();
  }, [open, employeeId, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{emp?.name || "Employee"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">Full profile and activity</DialogDescription>
        </DialogHeader>

        {loading || !emp ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <div className="space-y-5">
            {/* Contact */}
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Contact</h4>
              <div className="space-y-1.5 text-sm">
                {emp.position && (
                  <p className="flex items-center gap-2 text-foreground"><Briefcase size={14} className="text-primary" /> {emp.position}</p>
                )}
                <p className="flex items-center gap-2 text-foreground"><Mail size={14} className="text-primary" /> {emp.email}</p>
                {emp.phone && (
                  <p className="flex items-center gap-2 text-foreground"><Phone size={14} className="text-primary" /> {emp.phone}</p>
                )}
                <p className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CheckCircle2 size={12} className={emp.auth_user_id ? "text-emerald-400" : "text-muted-foreground"} />
                  {emp.auth_user_id ? "Linked account" : "Pending join"} · joined {format(new Date(emp.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </section>

            {/* Stats */}
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2"><BarChart3 size={12} /> Stats</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded border border-border bg-secondary/40 text-center">
                  <p className="text-xl font-bold text-foreground">{stats.completed}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                </div>
                <div className="p-3 rounded border border-border bg-secondary/40 text-center">
                  <p className="text-xl font-bold text-foreground">{stats.hoursWeek}h</p>
                  <p className="text-[10px] text-muted-foreground uppercase">This week</p>
                </div>
                <div className="p-3 rounded border border-border bg-secondary/40 text-center">
                  <p className="text-xl font-bold text-foreground">{stats.hoursMonth}h</p>
                  <p className="text-[10px] text-muted-foreground uppercase">This month</p>
                </div>
              </div>
            </section>

            {/* Upcoming Shifts */}
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2"><Clock size={12} /> Upcoming shifts</h4>
              {upcomingShifts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming shifts scheduled.</p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingShifts.map((s) => (
                    <div key={s.shift_date} className="flex justify-between text-sm p-2 rounded border border-border bg-secondary/30">
                      <span className="text-foreground">{format(new Date(s.shift_date + "T00:00:00"), "EEE, MMM d")}</span>
                      <span className="text-muted-foreground">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Bookings */}
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2"><CalendarDays size={12} /> Assigned bookings</h4>
              {upcomingBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming bookings.</p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingBookings.map((b) => (
                    <Card key={b.id} className="bg-secondary/30 border-border">
                      <CardContent className="p-2.5 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-foreground font-medium">{b.client_name}</p>
                          <p className="text-xs text-muted-foreground">{b.service}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-foreground">{format(new Date(b.booking_date + "T00:00:00"), "MMM d")}</p>
                          <p className="text-xs text-muted-foreground">{b.booking_time.slice(0, 5)} · {b.duration_minutes}m</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeProfileDialog;
