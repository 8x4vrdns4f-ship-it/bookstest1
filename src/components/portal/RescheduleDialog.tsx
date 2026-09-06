import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PortalBooking, fetchPortalSlots, reschedulePortalBooking,
} from "@/lib/clientPortal";

interface Props {
  booking: PortalBooking;
  sessionToken: string;
  onDone: () => void;
}

const prettyDay = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const RescheduleDialog = ({ booking, sessionToken, onDone }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingDays(true);
    fetchPortalSlots(sessionToken, booking.id)
      .then((r) => {
        setDays(r.open_days);
        setDate(r.open_days[0] ?? null);
      })
      .catch((e: Error) => toast({ title: "Could not load availability", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingDays(false));
  }, [open, booking.id, sessionToken, toast]);

  useEffect(() => {
    if (!open || !date) return;
    setLoadingSlots(true);
    setTime(null);
    fetchPortalSlots(sessionToken, booking.id, date)
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [open, date, booking.id, sessionToken]);

  const save = async () => {
    if (!date || !time) return;
    setSaving(true);
    try {
      await reschedulePortalBooking(sessionToken, booking.id, date, time);
      toast({ title: "Booking moved", description: `${prettyDay(date)} at ${time}` });
      setOpen(false);
      onDone();
    } catch (e) {
      toast({ title: "Could not reschedule", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move your booking</DialogTitle>
          <DialogDescription>
            {booking.service} with {booking.business.business_name || "the business"}
          </DialogDescription>
        </DialogHeader>

        {loadingDays ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : days.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No open days available right now.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Day</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.slice(0, 45).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      date === d
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {prettyDay(d)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Time</p>
              {loadingSlots ? (
                <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No free times on this day.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTime(s)}
                      className={`rounded-lg border py-2 text-xs transition-colors ${
                        time === s
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full" disabled={!date || !time || saving} onClick={save}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm new time"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
