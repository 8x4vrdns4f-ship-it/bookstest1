import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Clock, LogOut, Download, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import AddEmployeeDialog from "@/components/dashboard/AddEmployeeDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import BookingsList from "@/components/dashboard/BookingsList";
import CalendarView from "@/components/dashboard/CalendarView";
import ClientList from "@/components/dashboard/ClientList";
import StaffList from "@/components/dashboard/StaffList";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { buildWidgetHtml } from "@/lib/widgetTemplate";
import JoinRequestsCard from "@/components/dashboard/JoinRequestsCard";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState({ todayBookings: 0, totalClients: 0, upcoming: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setDisplayName(session.user.user_metadata?.display_name || session.user.email || "");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setDisplayName(session.user.user_metadata?.display_name || session.user.email || "");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [todayRes, clientsRes, upcomingRes] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_date", today),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("booking_date", today).in("status", ["pending", "confirmed"]),
      ]);
      setStats({
        todayBookings: todayRes.count || 0,
        totalClients: clientsRes.count || 0,
        upcoming: upcomingRes.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownloadWidget = () => {
    if (!user) return;
    const widgetCode = buildWidgetHtml({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      userId: user.id,
    });
    const blob = new Blob([widgetCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "booking-calendar-widget.html";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Widget downloaded!", description: "Embed this HTML file on your site to take bookings." });
  };

  if (!user) return null;

  const statCards = [
    { label: "Bookings Today", value: String(stats.todayBookings), icon: CalendarDays },
    { label: "Total Clients", value: String(stats.totalClients), icon: Users },
    { label: "Upcoming", value: String(stats.upcoming), icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Dashboard — BookSuite"
        description="Your BookSuite dashboard: today's bookings, upcoming appointments, clients, and staff at a glance."
        path="/dashboard"
        noIndex
      />
      <Navbar />
      <main className="flex-1 px-8 md:px-16 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hey, {displayName} 👋</h1>
            <p className="text-muted-foreground mt-1">Here's your overview</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button asChild variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
              <Link to="/settings"><SettingsIcon size={16} /> Settings</Link>
            </Button>
            <AddEmployeeDialog userId={user.id} />
            <Button
              onClick={handleDownloadWidget}
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-sm"
            >
              <Download size={16} />
              Download Calendar Widget
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-2"
            >
              <LogOut size={16} />
              Log Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon size={18} className="text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Join requests */}
        <div className="mb-8">
          <JoinRequestsCard businessUserId={user.id} />
        </div>

        {/* Charts row */}
        <div className="mb-8">
          <DashboardCharts userId={user.id} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bookings</TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Calendar</TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Clients</TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Staff</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings">
            <BookingsList userId={user.id} />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarView userId={user.id} />
          </TabsContent>
          <TabsContent value="clients">
            <ClientList userId={user.id} />
          </TabsContent>
          <TabsContent value="staff">
            <StaffList userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
