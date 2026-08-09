import { useCallback, useEffect, useState } from "react";
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
import {
  EmployeeBooking,
  EmployeeRecord,
  EmployeeShift,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notLinked, setNotLinked] = useState(false);
  const [selected, setSelected] = useState<EmployeeBooking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

    const today = todayISO();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 14);
    const horizonISO = `${horizon.getFullYear()}-${String(horizon.getMonth() + 1).padStart(2, "0")}-${String(horizon.getDate()).padStart(2, "0")}`;

    const [bizRes, bkRes, shiftRes] = await Promise.all([
      supabase.from("business_settings").select("business_name").eq("user_id", emp.user_id).maybeSingle(),
      supabase
        .from("bookings")
        .select("id, booking_date, booking_time, duration_minutes, client_name, client_email, service, status, notes, party_size, service_price")
        .eq("user_id", emp.user_id)
        .eq("assigned_employee_id", emp.id)
        .gte("booking_date", today)
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
    ]);

    setCompanyName(bizRes.data?.business_name || "Your company");
    setBookings((bkRes.data as EmployeeBooking[]) || []);
    setShifts((shiftRes.data as EmployeeShift[]) || []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
              <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh" disabled={refreshing}>
                <RefreshCw size={16} className={refreshing ? "animate-spin" : undefined} />
              </Button>
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
            {tab === "schedule" && <ScheduleView shifts={shifts} bookingCountByDate={bookingCountByDate} />}
            {tab === "profile" && (
              <EmployeeProfileCard
                employee={employee}
                email={email}
                companyName={companyName}
                onUpdated={(patch) => setEmployee((prev) => (prev ? { ...prev, ...patch } : prev))}
                onLogout={handleLogout}
              />
            )}

            <div className="sm:hidden">
              <EmployeeTabBar value={tab} onChange={setTab} />
            </div>

            <BookingDetailSheet
              booking={selected}
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              onStatusChange={updateStatus}
            />
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default EmployeeDashboard;
