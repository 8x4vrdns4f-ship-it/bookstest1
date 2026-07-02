import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Inbox, Clock } from "lucide-react";
import SectionCard from "@/components/app/SectionCard";
import EmptyState from "@/components/app/EmptyState";

type PendingRow = {
  id: string;
  client_name: string;
  client_email: string;
  service: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  deposit_amount: number | string;
  currency: string;
  status: string;
  charge_error: string | null;
  created_at: string;
};

const BookingRequestsCard = ({ userId }: { userId: string }) => {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from("pending_bookings")
      .select("id, client_name, client_email, service, booking_date, booking_time, duration_minutes, deposit_amount, currency, status, charge_error, created_at")
      .eq("user_id", userId)
      .in("status", ["awaiting_owner", "charging", "charge_failed"])
      .order("created_at", { ascending: false });
    setRows((data as PendingRow[]) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`pending-bookings-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_bookings", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const accept = async (row: PendingRow) => {
    setBusy(row.id);
    try {
      const { data, error } = await supabase.functions.invoke("charge-booking-deposit", {
        body: { pending_id: row.id },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) {
        toast({
          title: "Card charge failed",
          description: data?.message || "The customer's card could not be charged. They've been notified.",
          variant: "destructive",
        });
      } else {
        toast({ title: `Booking accepted — ${data.confirmation_code}`, description: "Deposit charged and customer emailed." });
      }
    } catch (e) {
      toast({ title: "Could not accept", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(null);
      load();
    }
  };

  const decline = async (row: PendingRow) => {
    const reason = window.prompt("Reason (shown to the customer):", "Sorry, we can't fit you in at that time.");
    if (reason === null) return;
    setBusy(row.id);
    try {
      const { error } = await supabase.functions.invoke("decline-pending-booking", {
        body: { pending_id: row.id, reason },
      });
      if (error) throw new Error(error.message);
      toast({ title: "Declined", description: "Customer notified. Card was not charged." });
    } catch (e) {
      toast({ title: "Could not decline", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(null);
      load();
    }
  };

  return (
    <SectionCard
      icon={<Inbox size={18} />}
      title="Booking requests"
      description="New requests from your widget. Accept to charge the deposit, decline to leave the card untouched."
    >
      {rows.length === 0 ? (
        <EmptyState icon={<Inbox />} title="No pending requests" description="New booking requests from your widget will appear here." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const ccy = String(r.currency || "GBP").toUpperCase();
            const sym = ccy === "USD" ? "$" : ccy === "EUR" ? "€" : ccy === "JPY" ? "¥" : "£";
            const dep = Number(r.deposit_amount || 0);
            const failed = r.status === "charge_failed";
            const charging = r.status === "charging";
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{r.client_name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        <Clock size={10} className="mr-1" />
                        {r.booking_date} · {r.booking_time.slice(0, 5)} · {r.duration_minutes}m
                      </Badge>
                      {failed && <Badge variant="destructive" className="text-[10px]">Charge failed</Badge>}
                      {charging && <Badge className="text-[10px]">Charging…</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.client_email} · {r.service}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deposit: {sym}{dep.toFixed(ccy === "JPY" ? 0 : 2)} — will only be charged on accept
                    </p>
                    {failed && r.charge_error && (
                      <p className="text-xs text-destructive mt-1">Reason: {r.charge_error}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="premium" onClick={() => accept(r)} disabled={busy === r.id || charging}>
                      <Check size={14} className="mr-1" />
                      {failed ? "Retry" : "Accept"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decline(r)} disabled={busy === r.id || charging}>
                      <X size={14} className="mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

export default BookingRequestsCard;
