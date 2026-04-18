import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, X } from "lucide-react";

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
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-primary/20 text-primary border-primary/30",
};

const BookingsList = ({ userId }: { userId: string }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    if (data) setBookings(data);
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    fetchBookings();
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
    toast({
      title: `Accepted — code ${codeData}`,
      description: b.client_email
        ? `Share with ${b.client_name}. Email sending activates once your domain is set up.`
        : `Share code ${codeData} with ${b.client_name} (no email on file).`,
    });
    fetchBookings();
  };

  const handleDecline = async (b: Booking) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", decline_reason: "Declined by business" })
      .eq("id", b.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Booking declined", description: b.client_email ? "Email sending activates once your domain is set up." : undefined });
    fetchBookings();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bookings").delete().eq("id", id);
    fetchBookings();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Bookings</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
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
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                {loading ? "Adding..." : "Add Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No bookings yet. Add one or share your calendar widget!</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">{b.client_name}</span>
                    <Badge variant="outline" className={statusColors[b.status]}>{b.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.service} · {b.booking_date} at {b.booking_time} · {b.duration_minutes}min
                  </p>
                  {b.notes && <p className="text-xs text-muted-foreground mt-1">{b.notes}</p>}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Select value={b.status} onValueChange={(val) => handleStatusChange(b.id, val)}>
                    <SelectTrigger className="w-[110px] h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingsList;
