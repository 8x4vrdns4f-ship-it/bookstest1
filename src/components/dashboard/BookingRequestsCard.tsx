import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Inbox, Clock, ChevronDown, ChevronRight, History } from "lucide-react";
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
  expired_at?: string | null;
};

const ACTIVE_STATUSES = ["awaiting_owner", "charging", "charge_failed"];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const BookingRequestsCard = ({ userId }: { userId: string }) => {
  const [active, setActive] = useState<PendingRow[]>([]);
  const [expired, setExpired] = useState<PendingRow[]>([]);
  const [ttlHours, setTtlHours] = useState<number>(48);
  const [busy, setBusy] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [{ data: act }, { data: exp }] = await Promise.all([
      supabase
        .from("pending_bookings")
        .select("id, client_name, client_email, service, booking_date, booking_time, duration_minutes, deposit_amount, currency, status, charge_error, created_at, expired_at")
        .eq("user_id", userId)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false }),
      supabase
        .from("pending_bookings")
        .select("id, client_name, client_email, service, booking_date, booking_time, duration_minutes, deposit_amount, currency, status, charge_error, created_at, expired_at")
        .eq("user_id", userId)
        .eq("status", "expired")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
        .order("expired_at", { ascending: false, nullsFirst: false })
        .limit(20),
    ]);
    setActive((act as PendingRow[]) || []);
    setExpired((exp as PendingRow[]) || []);
  };

  useEffect(() => {
    load();
    supabase.from("business_settings").select("pending_request_ttl_hours").eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (data) setTtlHours(Number((data as any).pending_request_ttl_hours) || 48); });
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

  const bothEmpty = active.length === 0 && expired.length === 0;

  return (
    <SectionCard
      icon={<Inbox size={18} />}
      title="Booking requests"
      description="New requests from your widget. Accept to charge the deposit, decline to leave the card untouched."
    >
      {bothEmpty ? (
        <EmptyState icon={<Inbox />} title="No pending requests" description="New booking requests from your widget will appear here." />
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map((r) => {
                const ccy = String(r.currency || "GBP").toUpperCase();
                const sym = ccy === "USD" ? "$" : ccy === "EUR" ? "€" : ccy === "JPY" ? "¥" : "£";
                const dep = Number(r.deposit_amount || 0);
                const failed = r.status === "charge_failed";
                const charging = r.status === "charging";
                const createdMs = new Date(r.created_at).getTime();
                const hoursLeft = Math.max(0, ttlHours - (Date.now() - createdMs) / 3_600_000);
                const expiresLabel = hoursLeft < 1
                  ? `Expires in ${Math.max(1, Math.round(hoursLeft * 60))}m`
                  : `Expires in ${Math.round(hoursLeft)}h`;
                const urgent = hoursLeft < 6;
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
                          <Badge variant={urgent ? "destructive" : "secondary"} className="text-[10px]">
                            {expiresLabel}
                          </Badge>
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

          {expired.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowExpired((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showExpired ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <History size={12} />
                {showExpired ? "Hide" : "Show"} {expired.length} expired request{expired.length === 1 ? "" : "s"}
              </button>
              {showExpired && (
                <div className="space-y-2 mt-2">
                  {expired.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border/60 bg-card/30 p-3 opacity-70">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{r.client_name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            <Clock size={10} className="mr-1" />
                            {r.booking_date} · {r.booking_time.slice(0, 5)} · {r.duration_minutes}m
                          </Badge>
                          <Badge variant="destructive" className="text-[10px]">Expired</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{r.client_email} · {r.service}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expired {relativeTime(r.expired_at || r.created_at)} · card was not charged
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
};

export default BookingRequestsCard;
