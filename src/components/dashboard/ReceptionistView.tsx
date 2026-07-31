import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, ScanLine, UserCheck, Clock, Camera, X } from "lucide-react";
import CameraScanner from "@/components/CameraScanner";
import EmptyState from "@/components/app/EmptyState";


type Booking = {
  id: string;
  client_name: string;
  service: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: string;
  confirmation_code: string | null;
  assigned_employee_id: string | null;
};

type Employee = { id: string; name: string; available_now: boolean };

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  waiting: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const ReceptionistView = ({ businessUserId }: { businessUserId: string }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const [bk, emps] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, client_name, service, booking_date, booking_time, duration_minutes, status, confirmation_code, assigned_employee_id")
        .eq("user_id", businessUserId)
        .gte("booking_date", today)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true }),
      supabase.from("employees").select("id, name, available_now").eq("user_id", businessUserId),
    ]);
    setBookings((bk.data || []) as Booking[]);
    setEmployees((emps.data || []) as Employee[]);
  }, [businessUserId]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`recept-bookings-${businessUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${businessUserId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [businessUserId, load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast({ title: "Could not update", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Marked ${status.replace("_", " ")}` });
  };

  const assignEmployee = async (id: string, employeeId: string) => {
    const { error } = await supabase.from("bookings").update({ assigned_employee_id: employeeId }).eq("id", id);
    if (error) { toast({ title: "Could not assign", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Assigned" });
  };

  const checkInWithCode = async (raw: string) => {
    const c = raw.trim().toUpperCase().slice(-6);
    if (c.length !== 6) {
      toast({ title: "Enter a 6-character code", variant: "destructive" });
      return;
    }
    const match = bookings.find((b) => (b.confirmation_code || "").toUpperCase() === c);
    if (!match) {
      toast({ title: "Code not found", description: "No upcoming booking with that code.", variant: "destructive" });
      return;
    }
    await updateStatus(match.id, "in_progress");
    setCode("");
    setScanning(false);
    setSearch(c);
  };

  const checkInByCode = () => checkInWithCode(code);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      (b.confirmation_code || "").toUpperCase().includes(q) ||
      b.client_name.toUpperCase().includes(q)
    );
  }, [bookings, search]);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ScanLine size={18} className="text-primary" /> Quick Check-In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scanning ? (
            <div className="space-y-2">
              <CameraScanner
                onScan={(t) => checkInWithCode(t)}
                onError={(m) => { toast({ title: "Camera error", description: m, variant: "destructive" }); setScanning(false); }}
              />
              <Button variant="outline" size="sm" onClick={() => setScanning(false)} className="w-full">
                <X size={14} className="mr-1" /> Stop scanning
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && checkInByCode()}
                placeholder="Enter 6-char code"
                maxLength={6}
                className="bg-secondary border-border font-mono tracking-widest text-lg uppercase"
              />
              <Button onClick={checkInByCode} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Check In
              </Button>
              <Button variant="outline" onClick={() => setScanning(true)} className="border-border">
                <Camera size={16} className="mr-1" /> Scan
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Scan the customer's QR code or type their 6-character code.</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-foreground">Today &amp; Upcoming</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or name…"
              className="pl-9 bg-secondary border-border h-9 text-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Clock size={20} />}
              title={search ? "No bookings match your search" : "Nothing booked yet"}
              description={
                search
                  ? "Try a different name or confirmation code."
                  : "Today's and upcoming appointments will appear here as they come in."
              }
            />

          ) : (
            <div className="space-y-3">
              {filtered.map((b) => (
                <div key={b.id} className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{b.client_name}</span>
                    <Badge variant="outline" className={statusColors[b.status]}>{b.status.replace("_", " ")}</Badge>
                    {b.confirmation_code && (
                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-mono">
                        {b.confirmation_code}
                      </Badge>
                    )}
                    {b.assigned_employee_id && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 gap-1">
                        <UserCheck size={10} /> {employees.find((e) => e.id === b.assigned_employee_id)?.name ?? "Assigned"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.service} · {b.booking_date} at {b.booking_time.slice(0, 5)} · {b.duration_minutes}min
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                      <SelectTrigger className="w-[150px] h-8 text-xs bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="waiting">Send to Waiting</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={b.assigned_employee_id ?? ""} onValueChange={(v) => assignEmployee(b.id, v)}>
                      <SelectTrigger className="w-[200px] h-8 text-xs bg-secondary border-border">
                        <SelectValue placeholder="Assign employee…" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {employees.filter((e) => e.available_now).length > 0 && (
                          <>
                            <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> On call now
                            </div>
                            {employees.filter((e) => e.available_now).map((e) => (
                              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                            ))}
                          </>
                        )}
                        <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">All staff</div>
                        {employees.map((e) => (
                          <SelectItem key={`all-${e.id}`} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceptionistView;
