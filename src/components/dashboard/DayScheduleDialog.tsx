import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Booking = {
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  client_name: string;
  service: string;
  status: string;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date | null;
  bookings: Booking[];
  startHour: number; // e.g. 9
  endHour: number;   // e.g. 18 (exclusive)
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  confirmed: "bg-green-500/20 text-green-300 border-green-500/40",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/40",
  completed: "bg-blue-500/20 text-blue-300 border-blue-500/40",
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const DayScheduleDialog = ({ open, onOpenChange, date, bookings, startHour, endHour }: Props) => {
  const slots = useMemo(() => {
    const out: number[] = [];
    for (let m = startHour * 60; m < endHour * 60; m += 30) out.push(m);
    return out;
  }, [startHour, endHour]);

  const dateStr = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";

  const dayBookings = bookings.filter((b) => b.booking_date === dateStr);

  // For each slot, find a booking that covers it
  const bookingForSlot = (slotMin: number) => {
    return dayBookings.find((b) => {
      const start = toMinutes(b.booking_time);
      const end = start + (b.duration_minutes || 30);
      return slotMin >= start && slotMin < end;
    });
  };

  // Identify the first slot of each booking so we render the label only once
  const isBookingStart = (slotMin: number, b: Booking) => toMinutes(b.booking_time) === slotMin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {date?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {slots.map((slotMin) => {
            const b = bookingForSlot(slotMin);
            if (b) {
              const showLabel = isBookingStart(slotMin, b);
              const start = toMinutes(b.booking_time);
              const end = start + (b.duration_minutes || 30);
              return (
                <div
                  key={slotMin}
                  className={`flex items-stretch gap-3 rounded-md border ${statusColors[b.status] || "bg-primary/10 border-primary/30"}`}
                >
                  <div className="text-xs font-mono text-muted-foreground py-2 pl-3 w-16 shrink-0">
                    {fmt(slotMin)}
                  </div>
                  <div className="py-2 pr-3 flex-1 min-w-0">
                    {showLabel ? (
                      <>
                        <div className="text-sm font-medium text-foreground truncate">{b.client_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {b.service} · {fmt(start)}–{fmt(end)}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">↑ continued</div>
                    )}
                  </div>
                  {showLabel && (
                    <Badge variant="outline" className="self-center mr-3 text-[10px] capitalize border-current">
                      {b.status}
                    </Badge>
                  )}
                </div>
              );
            }
            return (
              <div key={slotMin} className="flex items-center gap-3 rounded-md border border-border/50 bg-secondary/20 py-2 px-3">
                <div className="text-xs font-mono text-muted-foreground w-16 shrink-0">{fmt(slotMin)}</div>
                <div className="text-xs text-muted-foreground/60">Available</div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayScheduleDialog;
