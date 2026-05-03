import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, CheckCircle2, AlertCircle, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type DerivedStatus = "in_progress" | "free" | "unavailable";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  status: DerivedStatus;
  manual_status: string | null;
}

interface Booking {
  id: string;
  client_name: string;
  service: string;
  booking_time: string;
  duration_minutes: number;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: StaffMember | null;
  userId: string;
  date: string; // yyyy-mm-dd
  onChanged: () => void;
}

const EmployeeActionsDialog = ({ open, onOpenChange, employee, userId, date, onChanged }: Props) => {
  const { toast } = useToast();
  const [assigned, setAssigned] = useState<Booking[]>([]);
  const [unassigned, setUnassigned] = useState<Booking[]>([]);

  useEffect(() => {
    if (!open || !employee) return;
    (async () => {
      const [a, u] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, client_name, service, booking_time, duration_minutes, status")
          .eq("user_id", userId)
          .eq("booking_date", date)
          .eq("assigned_employee_id", employee.id)
          .order("booking_time"),
        supabase
          .from("bookings")
          .select("id, client_name, service, booking_time, duration_minutes, status")
          .eq("user_id", userId)
          .eq("booking_date", date)
          .is("assigned_employee_id", null)
          .in("status", ["pending", "confirmed"])
          .order("booking_time"),
      ]);
      setAssigned((a.data as Booking[]) || []);
      setUnassigned((u.data as Booking[]) || []);
    })();
  }, [open, employee, userId, date]);

  if (!employee) return null;

  const setStatus = async (status: "free" | "unavailable" | null) => {
    const { error } = await supabase
      .from("employees")
      .update({
        manual_status: status,
        manual_status_date: status ? date : null,
      })
      .eq("id", employee.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status updated" });
    onChanged();
  };

  const assignBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ assigned_employee_id: employee.id })
      .eq("id", bookingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Assigned", description: `Booking assigned to ${employee.name}.` });
    onChanged();
    // refresh local
    setUnassigned((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const unassign = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ assigned_employee_id: null })
      .eq("id", bookingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Unassigned" });
    onChanged();
    setAssigned((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const statusBadge = {
    in_progress: <Badge className="bg-primary text-primary-foreground">In Progress</Badge>,
    free: <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Free</Badge>,
    unavailable: <Badge className="bg-destructive/20 text-destructive border border-destructive/40">Unavailable</Badge>,
  }[employee.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 flex-wrap">
            {employee.name} {statusBadge}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {employee.position || "Team member"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground">
          <a href={`mailto:${employee.email}`} className="flex items-center gap-2 hover:text-foreground">
            <Mail size={14} /> {employee.email}
          </a>
          {employee.phone && (
            <a href={`tel:${employee.phone}`} className="flex items-center gap-2 hover:text-foreground">
              <Phone size={14} /> {employee.phone}
            </a>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Set status for today</p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setStatus("free")} className="gap-1">
              <CheckCircle2 size={14} /> Free
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("unavailable")} className="gap-1">
              <AlertCircle size={14} /> Unavailable
            </Button>
            {employee.manual_status && (
              <Button size="sm" variant="ghost" onClick={() => setStatus(null)}>
                Clear override
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            "In Progress" is set automatically when a booking is currently happening.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Briefcase size={12} /> Today's bookings
          </p>
          {assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings assigned today.</p>
          ) : (
            <div className="space-y-2">
              {assigned.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded bg-secondary border border-border">
                  <div className="text-sm">
                    <p className="text-foreground font-medium">{b.booking_time.slice(0, 5)} — {b.client_name}</p>
                    <p className="text-muted-foreground text-xs">{b.service} • {b.status}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => unassign(b.id)} className="text-destructive hover:text-destructive">
                    Unassign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assign to a booking</p>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unassigned bookings today.</p>
          ) : (
            <div className="space-y-2">
              {unassigned.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded bg-secondary border border-border">
                  <div className="text-sm">
                    <p className="text-foreground font-medium">{b.booking_time.slice(0, 5)} — {b.client_name}</p>
                    <p className="text-muted-foreground text-xs">{b.service}</p>
                  </div>
                  <Button size="sm" onClick={() => assignBooking(b.id)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeActionsDialog;
