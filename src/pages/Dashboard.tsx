import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Clock, LogOut, Download } from "lucide-react";
import AddEmployeeDialog from "@/components/dashboard/AddEmployeeDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingsList from "@/components/dashboard/BookingsList";
import CalendarView from "@/components/dashboard/CalendarView";
import ClientList from "@/components/dashboard/ClientList";
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

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const widgetCode = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Booking Calendar Widget</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: transparent; }
  .widget { max-width: 420px; margin: 0 auto; background: #1e2433; border-radius: 12px; padding: 24px; color: #fff; }
  .widget h2 { font-size: 18px; margin-bottom: 16px; color: #5bade8; }
  .widget label { display: block; font-size: 13px; margin-bottom: 4px; color: #9ca3af; }
  .widget input, .widget select, .widget textarea {
    width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #2d3548;
    background: #263040; color: #fff; font-size: 14px; margin-bottom: 12px; outline: none;
  }
  .widget input:focus, .widget select:focus, .widget textarea:focus { border-color: #5bade8; }
  .widget button {
    width: 100%; padding: 10px; border: none; border-radius: 8px;
    background: #5bade8; color: #1a1f2e; font-weight: 600; font-size: 14px; cursor: pointer;
  }
  .widget button:hover { background: #4a9ad8; }
  .widget button:disabled { opacity: 0.6; cursor: not-allowed; }
  .widget .success { text-align: center; padding: 20px; color: #4ade80; }
  .widget .row { display: flex; gap: 8px; }
  .widget .row > div { flex: 1; }
</style>
</head>
<body>
<div class="widget" id="booking-widget">
  <h2>Book an Appointment</h2>
  <form id="booking-form">
    <label>Your Name *</label>
    <input type="text" id="bw-name" required>
    <label>Your Email</label>
    <input type="email" id="bw-email">
    <label>Service *</label>
    <input type="text" id="bw-service" required placeholder="e.g. Consultation">
    <div class="row">
      <div><label>Date *</label><input type="date" id="bw-date" required></div>
      <div><label>Time *</label><input type="time" id="bw-time" required></div>
    </div>
    <div class="row">
      <div><label>Duration (min)</label><input type="number" id="bw-duration" value="60" min="15"></div>
    </div>
    <label>Notes</label>
    <textarea id="bw-notes" rows="2"></textarea>
    <button type="submit" id="bw-submit">Book Now</button>
  </form>
  <div class="success" id="bw-success" style="display:none">
    <p style="font-size:24px;margin-bottom:8px">✓</p>
    <p>Booking submitted successfully!</p>
    <p style="font-size:12px;color:#9ca3af;margin-top:8px">You'll receive a confirmation soon.</p>
  </div>
</div>
<script>
(function(){
  var SUPABASE_URL = "${supabaseUrl}";
  var SUPABASE_KEY = "${supabaseKey}";
  var USER_ID = "${user.id}";

  document.getElementById("booking-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    var btn = document.getElementById("bw-submit");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    try {
      var res = await fetch(SUPABASE_URL + "/rest/v1/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          user_id: USER_ID,
          client_name: document.getElementById("bw-name").value,
          client_email: document.getElementById("bw-email").value || null,
          service: document.getElementById("bw-service").value,
          booking_date: document.getElementById("bw-date").value,
          booking_time: document.getElementById("bw-time").value,
          duration_minutes: parseInt(document.getElementById("bw-duration").value) || 60,
          notes: document.getElementById("bw-notes").value || null,
          status: "pending"
        })
      });
      if (!res.ok) throw new Error("Failed");
      document.getElementById("booking-form").style.display = "none";
      document.getElementById("bw-success").style.display = "block";
    } catch(err) {
      alert("Something went wrong. Please try again.");
      btn.disabled = false;
      btn.textContent = "Book Now";
    }
  });
})();
</script>
</body>
</html>`;

    const blob = new Blob([widgetCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "booking-calendar-widget.html";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Widget downloaded!", description: "Embed this HTML file into your website to receive bookings." });
  };

  if (!user) return null;

  const statCards = [
    { label: "Bookings Today", value: String(stats.todayBookings), icon: CalendarDays },
    { label: "Total Clients", value: String(stats.totalClients), icon: Users },
    { label: "Upcoming", value: String(stats.upcoming), icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 px-8 md:px-16 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hey, {displayName} 👋</h1>
            <p className="text-muted-foreground mt-1">Here's your overview</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <AddEmployeeDialog userId={user.id} />
            <Button
              disabled
              aria-disabled="true"
              className="gap-2 bg-accent text-accent-foreground font-semibold text-sm opacity-50 cursor-not-allowed pointer-events-none"
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

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bookings</TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Calendar</TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Clients</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings">
            <BookingsList userId={user.id} />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>
          <TabsContent value="clients">
            <ClientList userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
