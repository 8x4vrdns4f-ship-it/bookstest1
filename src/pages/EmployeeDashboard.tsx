import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import EmptyState from "@/components/app/EmptyState";
import ListSkeleton from "@/components/app/ListSkeleton";
import EmployeeTabBar, { EmployeeTab } from "@/components/employee/EmployeeTabBar";
import TodayView from "@/components/employee/TodayView";
import ScheduleView from "@/components/employee/ScheduleView";
import EmployeeProfileCard from "@/components/employee/EmployeeProfileCard";
import BookingDetailSheet from "@/components/employee/BookingDetailSheet";
import EmployeeNotifications from "@/components/employee/EmployeeNotifications";
import TimeOffCard from "@/components/employee/TimeOffCard";
import EmployeeStatsCard from "@/components/employee/EmployeeStatsCard";
import {
  EmployeeBooking,
  EmployeeNotification,
  EmployeeRecord,
  EmployeeShift,
  EmployeeStats,
  TimeOffRequest,
  minutesSinceMidnight,
  shiftISO,
  todayISO,
} from "@/components/employee/types";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<EmployeeTab>("today");
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [bookings, setBookings] = useState<EmployeeBooking[]>([]);
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [pastShifts, setPastShifts] = useState<EmployeeShift[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [notifications, setNotifications] = useState<EmployeeNotification[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({
    completedThisWeek: 0,
    hoursThisWeek: 0,
    averageRating: null,
    ratingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notLinked, setNotLinked] = useState(false);
  const [selected, setSelected] = useState<EmployeeBooking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const employeeIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setEmail(session.user.email || "");

    const { data: emp } = await supabase
      .from("employees")
      .select("id, name, phone, position, available_now, manual_status, manual_status_date, user_id")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    if (!emp) { setNotLinked(true); setLoading(false); return; }
    setNotLinked(false);
    setEmployee(emp as EmployeeRecord);
    employeeIdRef.current = emp.id;

    const today = todayISO();
    const horizonISO = shiftISO(14);
    const weekAgoISO = shiftISO(-7);

    const [bizRes, bkRes, shiftRes, pastShiftRes, toRes, notifRes, reviewRes] = await Promise.all([
      supabase.from("business_settings").select("business_name").eq("user_id", emp.user_id).maybeSingle(),
      supabase
        .from("bookings")
        .select("id, booking_date, booking_time, duration_minutes, client_name, client_email, service, status, notes, party_size, service_price")
        .eq("user_id", emp.user_id)
        .eq("assigned_employee_id", emp.id)
        .gte("booking_date", weekAgoISO)
        .lte("booking_date", horizonISO)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true }),
      supabase
        .from("employee_shifts")
        .select("id, shift_date, start_time, end_time")
        .eq("employee_id", emp.id)
        .gte("shift_date", today)
        .lte("shift_date", horizonISO)
        .order("shift_date", { ascending: true }),
      supabase
        .from("employee_shifts")
        .select("id, shift_date, start_time, end_time")
        .eq("employee_id", emp.id)
        .gte("shift_date", weekAgoISO)
        .lt("shift_date", today)
        .order("shift_date", { ascending: false }),
      supabase
        .from("time_off_requests")
        .select("id, start_date, end_date, reason, status, decision_note, created_at")
        .eq("employee_id", emp.id)
        .order("start_date", { ascending: false })
        .limit(20),
      supabase
        .from("employee_notifications")
        .select("id, type, title, body, booking_id, read_at, created_at")
        .eq("employee_id", emp.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("reviews")
        .select("rating, bookings!inner(assigned_employee_id)")
        .eq("user_id", emp.user_id)
        .eq("bookings.assigned_employee_id", emp.id),
    ]);

    const allBookings = (bkRes.data as EmployeeBooking[]) || [];
    const past = (pastShiftRes.data as EmployeeShift[]) || [];

    setCompanyName(bizRes.data?.business_name || "Your company");
    setBookings(allBookings);
    setShifts((shiftRes.data as EmployeeShift[]) || []);
    setPastShifts(past);
    setTimeOff((toRes.data as TimeOffRequest[]) || []);
    setNotifications((notifRes.data as EmployeeNotification[]) || []);

    const ratings = ((reviewRes.data as { rating: number }[]) || []).map((r) => r.rating);
    const workedShifts = [...past, ...(((shiftRes.data as EmployeeShift[]) || []).filter((s) => s.shift_date === today))];
    setStats({
      completedThisWeek: allBookings.filter((b) => b.status === "completed" && b.booking_date >= weekAgoISO).length,
      hoursThisWeek: workedShifts.reduce(
        (sum, s) => sum + Math.max(0, (minutesSinceMidnight(s.end_time) - minutesSinceMidnight(s.start_time)) / 60),
        0,
      ),
      averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      ratingCount: ratings.length,
    });
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  // Live updates: new assignments, changes and notifications
  useEffect(() => {
    if (!employee) return;
    const channel = supabase
      .channel(`employee-live-${employee.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `assigned_employee_id=eq.${employee.id}` },
        () => { load(); },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "employee_notifications", filter: `employee_id=eq.${employee.id}` },
        (payload) => {
          const n = payload.new as EmployeeNotification;
          setNotifications((prev) => [n, ...prev.filter((p) => p.id !== n.id)]);
          toast({ title: n.title, description: n.body ?? undefined });
          load();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [employee, load, toast]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Pull to refresh (mobile)
  useEffect(() => {
    let startY = 0;
    let pulling = false;
    const onStart = (e: TouchEvent) => {
      pulling = window.scrollY <= 0;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      if (!pulling) return;
      const delta = e.changedTouches[0].clientY - startY;
      pulling = false;
      if (delta > 90 && window.scrollY <= 0) refresh();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Couldn't update booking", description: error.message, variant: "destructive" });
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    toast({ title: "Booking updated" });
  };

  const flagRunningLate = async (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;
    const stamp = new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const note = `${booking.notes ? `${booking.notes}\n` : ""}[${stamp}] ${employee?.name ?? "Staff"} is running late.`;
    const { error } = await supabase.from("bookings").update({ notes: note }).eq("id", id);
    if (error) {
      toast({ title: "Couldn't flag", description: error.message, variant: "destructive" });
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, notes: note } : b)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, notes: note } : prev));
    toast({ title: "Manager notified", description: "A note was added to this booking." });
  };

  const markAllRead = async () => {
    if (!employee) return;
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase.from("employee_notifications").update({ read_at: now }).in("id", unreadIds);
  };

  const openNotification = async (n: EmployeeNotification) => {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, read_at: now } : p)));
      await supabase.from("employee_notifications").update({ read_at: now }).eq("id", n.id);
    }
    const booking = n.booking_id ? bookings.find((b) => b.id === n.booking_id) : null;
    if (booking) {
      setSelected(booking);
      setSheetOpen(true);
    } else {
      setTab("today");
    }
  };

  const today = todayISO();
  const todayBookings = bookings.filter((b) => b.booking_date === today);
  const todayShift = shifts.find((s) => s.shift_date === today) || null;
  const bookingCountByDate = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.booking_date] = (acc[b.booking_date] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Employee Dashboard — BookSuite"
        description="Your BookSuite employee view: today's appointments, your shifts and your profile."
        path="/employee-dashboard"
        noIndex
      />
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-6 pb-28 sm:pb-10 max-w-3xl w-full mx-auto">
        {loading ? (
          <ListSkeleton rows={4} />
        ) : notLinked ? (
          <EmptyState
            icon={<Building2 size={20} />}
            title="You're not linked to a company yet"
            description="Open the invite link your manager emailed you, or use 'Join a Company' from the home page."
            action={<Button onClick={() => navigate("/")}>Back to home</Button>}
          />
        ) : employee ? (
          <>
            <header className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-primary text-xs font-semibold uppercase tracking-wide">{companyName}</p>
                <h1 className="text-2xl font-bold text-foreground mt-1">Hey, {employee.name.split(" ")[0]}</h1>
              </div>
              <div className="flex items-center gap-2">
                <EmployeeNotifications items={notifications} onMarkAllRead={markAllRead} onSelect={openNotification} />
                <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh" disabled={refreshing}>
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : undefined} />
                </Button>
              </div>
            </header>

            <div className="hidden sm:block mb-5">
              <EmployeeTabBar value={tab} onChange={setTab} />
            </div>

            {tab === "today" && (
              <TodayView
                bookings={todayBookings}
                shift={todayShift}
                onSelect={(b) => { setSelected(b); setSheetOpen(true); }}
              />
            )}
            {tab === "schedule" && (
              <ScheduleView
                shifts={shifts}
                pastShifts={pastShifts}
                bookingCountByDate={bookingCountByDate}
                timeOff={timeOff}
              />
            )}
            {tab === "profile" && (
              <div className="space-y-4">
                <EmployeeStatsCard stats={stats} />
                <TimeOffCard employee={employee} requests={timeOff} onChanged={load} />
                <EmployeeProfileCard
                  employee={employee}
                  email={email}
                  companyName={companyName}
                  onUpdated={(patch) => setEmployee((prev) => (prev ? { ...prev, ...patch } : prev))}
                  onLogout={handleLogout}
                />
              </div>
            )}

            <div className="sm:hidden">
              <EmployeeTabBar value={tab} onChange={setTab} />
            </div>

            <BookingDetailSheet
              booking={selected}
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              onStatusChange={updateStatus}
              onRunningLate={flagRunningLate}
            />
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default EmployeeDashboard;
