import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppDialog } from "@/components/app/AppDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cancelBookingAsOwner, cancelToastText, chargedAmount, money, type PaymentFields } from "@/lib/bookingCancel";
import { Calendar, Clock, Mail, User, FileText, UserCheck } from "lucide-react";

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
  assigned_employee_id?: string | null;
  refund_error?: string | null;
  refund_amount?: number | null;
} & PaymentFields;

type Employee = { id: string; name: string; position: string | null };

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-primary/20 text-primary border-primary/30",
};

type Props = {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ownerId: string;
  currency?: string;
  onChanged?: () => void;
};

const BookingDetailDialog = ({ booking, open, onOpenChange, ownerId, currency = "GBP", onChanged }: Props) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    supabase
      .from("employees")
      .select("id, name, position")
      .eq("user_id", ownerId)
      .then(({ data }) => setEmployees(data || []));
  }, [open, ownerId]);

  if (!booking) return null;

  const handleAssign = async (employeeId: string) => {
    setAssigning(true);
    const value = employeeId === "__none__" ? null : employeeId;
    const { error } = await supabase
      .from("bookings")
      .update({ assigned_employee_id: value })
      .eq("id", booking.id);
    setAssigning(false);
    if (error) {
      toast({ title: "Could not assign", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: value ? "Employee assigned" : "Assignment cleared" });
    onChanged?.();
  };

  const handleStatus = async (status: string) => {
    if (status === "cancelled") {
      const r = await cancelBookingAsOwner(booking, { currency });
      if (r.cancelledByUser) return;
      const t = cancelToastText(r, currency);
      toast({ title: t.title, description: t.description, variant: t.destructive ? "destructive" : undefined });
      if (r.ok) onChanged?.();
      return;
    }
    const { error } = await supabase.from("bookings").update({ status }).eq("id", booking.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    onChanged?.();
  };

  const charged = chargedAmount(booking);
  const paidInFull = booking.payment_option === "full";
  const refundLabel = paidInFull ? "Refund payment" : "Refund deposit";
  const runRefund = async (retry: boolean) => {
    const amt = retry && booking.refund_amount ? Number(booking.refund_amount) : charged;
    if (!confirm(`${retry ? "Retry refund" : refundLabel}: refund ${money(amt, currency)} to the client?`)) return;
    const { data, error } = await supabase.functions.invoke("refund-booking-deposit", { body: { booking_id: booking.id } });
    if (error || !data?.ok) {
      toast({ title: "Refund failed", description: "The booking is marked \"Refund failed\". You can retry or refund manually.", variant: "destructive" });
      onChanged?.();
      return;
    }
    toast({ title: "Refund sent", description: `${money(Number(data.amount ?? amt), currency)} refunded.` });
    onChanged?.();
    onOpenChange(false);
  };

  const assignedName = employees.find((e) => e.id === booking.assigned_employee_id)?.name;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          {booking.client_name}
          <Badge variant="outline" className={statusColors[booking.status]}>{booking.status.replace("_", " ")}</Badge>
        </span>
      }
      description={
        booking.confirmation_code ? (
          <span className="inline-block mt-1 px-2 py-0.5 rounded font-mono text-xs bg-primary/20 text-primary border border-primary/30">
            {booking.confirmation_code}
          </span>
        ) : undefined
      }
      icon={User}
      size="md"
      footer={
        <>
          {booking.payment_status === "paid" && booking.stripe_payment_intent_id && charged > 0 && (
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => runRefund(false)}
            >
              {refundLabel} ({money(charged, currency)})
            </Button>
          )}
          {booking.payment_status === "refund_failed" && (
            <div className="mr-auto flex items-center gap-2">
              <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/40" title={booking.refund_error || undefined}>
                Refund failed
              </Badge>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => runRefund(true)}>
                Retry refund
              </Button>
            </div>
          )}
          {booking.payment_status === "refunded" && (
            <div className="text-xs text-muted-foreground mr-auto">Payment was refunded.</div>
          )}
          {booking.payment_status === "partially_refunded" && (
            <div className="text-xs text-muted-foreground mr-auto">
              Partly refunded{booking.refund_amount ? ` (${money(Number(booking.refund_amount), currency)})` : ""}; deposit kept.
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">Close</Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <Row icon={<FileText size={14} />} label="Service" value={booking.service} />
        <Row icon={<Calendar size={14} />} label="Date" value={new Date(booking.booking_date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />
        <Row icon={<Clock size={14} />} label="Time" value={`${booking.booking_time.slice(0, 5)} · ${booking.duration_minutes} min`} />
        <Row icon={<User size={14} />} label="Client" value={booking.client_name} />
        {booking.client_email && <Row icon={<Mail size={14} />} label="Email" value={booking.client_email} />}
        {booking.notes && <Row icon={<FileText size={14} />} label="Notes" value={booking.notes} />}
        {assignedName && <Row icon={<UserCheck size={14} />} label="Assigned" value={assignedName} />}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Assign Employee</label>
          <Select
            value={booking.assigned_employee_id || "__none__"}
            onValueChange={handleAssign}
            disabled={assigning}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="__none__">Unassigned</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}{e.position ? ` · ${e.position}` : ""}
                </SelectItem>
              ))}
              {employees.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No employees yet — add one from the dashboard.</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Status</label>
          <Select value={booking.status} onValueChange={handleStatus}>
            <SelectTrigger className="bg-secondary border-border">
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
        </div>
      </div>
    </AppDialog>
  );
};

const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className="text-foreground break-words">{value}</div>
    </div>
  </div>
);

export default BookingDetailDialog;
