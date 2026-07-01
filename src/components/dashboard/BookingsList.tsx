import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, X, Search, UserCheck, ChevronRight, Calendar } from "lucide-react";
import BookingDetailDialog from "./BookingDetailDialog";
import { handleTierError } from "@/lib/tierError";
import { sendEmail, formatDate, formatTime } from "@/lib/sendEmail";
import SectionCard from "@/components/app/SectionCard";
import EmptyState from "@/components/app/EmptyState";


type Booking = {
  id: string;
  client_name: string;
  client_email: string | null;
  service: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  confirmation_code: string | null;
  assigned_employee_id: string | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-primary/20 text-primary border-primary/30",
};

const BookingsList = ({ userId }: { userId: string }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, string>>({});
  const [businessName, setBusinessName] = useState<string>("");
  const [companyCode, setCompanyCode] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    service: "",
    booking_date: "",
    booking_time: "",
    duration_minutes: 60,
    notes: "",
  });

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });
    if (data) setBookings(data as Booking[]);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees").select("id, name").eq("user_id", userId);
    const map: Record<string, string> = {};
    (data || []).forEach((e) => { map[e.id] = e.name; });
    setEmployeesMap(map);
  };

  useEffect(() => {
    fetchBookings();
    fetchEmployees();
    supabase.from("business_settings").select("business_name, company_code").eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (data) { setBusinessName(data.business_name || ""); setCompanyCode(data.company_code || ""); }
      });

    const channel = supabase
      .channel(`bookings-list-changes-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Keep open detail in sync with realtime updates
  useEffect(() => {
    if (!detail) return;
    const fresh = bookings.find((b) => b.id === detail.id);
    if (fresh && fresh !== detail) setDetail(fresh);
  }, [bookings, detail]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      (b.confirmation_code || "").toUpperCase().includes(q) ||
      b.client_name.toUpperCase().includes(q) ||
      (b.client_email || "").toUpperCase().includes(q)
    );
  }, [bookings, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("bookings").insert({
      ...form,
      user_id: userId,
      client_email: form.client_email || null,
      notes: form.notes || null,
    });
    if (error) {
      if (!handleTierError(error)) toast({ title: "Error", description: error.message, variant: "destructive" });

    } else {
      toast({ title: "Booking added!" });
      setOpen(false);
      setForm({ client_name: "", client_email: "", service: "", booking_date: "", booking_time: "", duration_minutes: 60, notes: "" });
      fetchBookings();
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
  };

  const handleAccept = async (b: Booking) => {
    const { data: codeData, error: codeErr } = await supabase.rpc("generate_booking_code");
    if (codeErr || !codeData) {
      toast({ title: "Could not generate code", description: codeErr?.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed", confirmation_code: codeData })
      .eq("id", b.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (b.client_email) {
      const checkInUrl = companyCode
        ? `${window.location.origin}/kiosk/${companyCode}?code=${codeData}`
        : undefined;
      sendEmail("booking-confirmed", b.client_email, `booking-confirm-${b.id}`, {
        businessName, clientName: b.client_name, service: b.service,
        date: formatDate(b.booking_date), time: formatTime(b.booking_time),
        confirmationCode: codeData, checkInUrl,
      });
    }
    toast({ title: `Accepted — code ${codeData}`, description: `Share with ${b.client_name}` });
  };

  const handleDecline = async (b: Booking) => {
    const reason = "Declined by business";
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", decline_reason: reason })
      .eq("id", b.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (b.client_email) {
      sendEmail("booking-declined", b.client_email, `booking-decline-${b.id}`, {
        businessName, clientName: b.client_name, service: b.service,
        date: formatDate(b.booking_date), time: formatTime(b.booking_time), reason,
      });
    }
    toast({ title: "Booking declined" });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bookings").delete().eq("id", id);
  };

  return (
    <SectionCard
      icon={<Calendar size={18} />}
      title="Bookings"
      description="Manage incoming requests and confirmed sessions."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="premium" className="gap-1">
              <Plus size={14} /> Add Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>New Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Client Name</Label>
                  <Input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Service</Label>
                  <Input required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" required value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label>Time</Label>
                  <Input type="time" required value={form.booking_time} onChange={(e) => setForm({ ...form, booking_time: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Duration (min)</Label>
                  <Input type="number" min={15} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-border" rows={1} />
                </div>
              </div>
              <Button type="submit" disabled={loading} variant="premium" className="w-full">
                {loading ? "Adding..." : "Add Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, name, or email…"
          className="pl-9 bg-secondary border-border h-9 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar size={20} />}
          title={search ? "No bookings match your search" : "No bookings yet"}
          description={search ? "Try a different code, name, or email." : "Add one manually or share your calendar widget to start receiving bookings."}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-lg bg-secondary/40 border border-border hover:border-primary/40 hover:bg-secondary/60 transition-colors cursor-pointer"
              onClick={() => setDetail(b)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{b.client_name}</span>
                  <Badge variant="outline" className={statusColors[b.status]}>{b.status.replace("_", " ")}</Badge>
                  {b.confirmation_code && (
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-mono">
                      {b.confirmation_code}
                    </Badge>
                  )}
                  {b.assigned_employee_id && employeesMap[b.assigned_employee_id] && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
                      <UserCheck size={10} /> {employeesMap[b.assigned_employee_id]}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {b.service} · {b.booking_date} at {b.booking_time.slice(0, 5)} · {b.duration_minutes}min
                  {b.client_email && <> · {b.client_email}</>}
                </p>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {b.status === "pending" ? (
                  <>
                    <Button size="sm" onClick={() => handleAccept(b)} className="h-8 gap-1 bg-success text-success-foreground hover:bg-success/90">
                      <Check size={14} /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecline(b)} className="h-8 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                      <X size={14} /> Decline
                    </Button>
                  </>
                ) : (
                  <Select value={b.status} onValueChange={(val) => handleStatusChange(b.id, val)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(b.id)}>
                  <Trash2 size={14} />
                </Button>
                <ChevronRight size={14} className="text-muted-foreground hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      )}

      <BookingDetailDialog
        booking={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        ownerId={userId}
        onChanged={() => { /* realtime will refresh */ }}
      />
    </SectionCard>
  );
};

export default BookingsList;
