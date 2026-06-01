import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LogOut, CalendarDays, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  client_name: string;
  service: string;
  status: string;
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableNow, setAvailableNow] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: emp } = await supabase
        .from("employees")
        .select("id, name, user_id, available_now")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!emp) {
        toast({ title: "Not linked to a company", description: "Use 'Join a Company' from the home page.", variant: "destructive" });
        navigate("/");
        return;
      }
      setEmployeeId(emp.id);
      setEmployeeName(emp.name);
      setAvailableNow(!!emp.available_now);

      const { data: biz } = await supabase
        .from("business_settings")
        .select("business_name")
        .eq("user_id", emp.user_id)
        .maybeSingle();
      setCompanyName(biz?.business_name || "Your Company");

      const today = new Date().toISOString().split("T")[0];
      const { data: bk } = await supabase
        .from("bookings")
        .select("id, booking_date, booking_time, duration_minutes, client_name, service, status")
        .eq("user_id", emp.user_id)
        .eq("assigned_employee_id", emp.id)
        .gte("booking_date", today)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      setBookings(bk || []);
      setLoading(false);
    })();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Employee Dashboard — BookSuite"
        description="Your BookSuite employee view: see upcoming bookings assigned to you."
        path="/employee-dashboard"
        noIndex
      />
      <Navbar />
      <main className="flex-1 px-6 md:px-16 py-10 max-w-5xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-wide">{companyName}</p>
            <h1 className="text-3xl font-bold text-foreground mt-1">Hey, {employeeName} 👋</h1>
            <p className="text-muted-foreground mt-1">Your upcoming schedule</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
            <LogOut size={16} /> Log Out
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            <CardTitle className="text-foreground">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : bookings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bookings assigned to you yet.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/40 border border-border">
                    <div>
                      <p className="text-foreground font-medium">{b.client_name}</p>
                      <p className="text-xs text-muted-foreground">{b.service} · {b.duration_minutes} min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">{new Date(b.booking_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                      <p className="text-xs text-muted-foreground">{b.booking_time.slice(0, 5)} · <span className="capitalize">{b.status}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EmployeeDashboard;
