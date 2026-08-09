import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/app/EmptyState";
import { CalendarDays, Clock, Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { EmployeeBooking, EmployeeShift, formatTime, minutesSinceMidnight } from "./types";

type Props = {
  bookings: EmployeeBooking[];
  shift: EmployeeShift | null;
  onSelect: (b: EmployeeBooking) => void;
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[16px] border border-border bg-card p-3 text-center">
    <p className="text-xl font-bold text-foreground leading-none">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
  </div>
);

export default function TodayView({ bookings, shift, onSelect }: Props) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const upcoming = bookings.filter(
    (b) => minutesSinceMidnight(b.booking_time) >= nowMins && !["completed", "cancelled", "no_show"].includes(b.status),
  );
  const next = upcoming[0];
  const minsToNext = next ? minutesSinceMidnight(next.booking_time) - nowMins : null;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const shiftHours = shift
    ? Math.max(0, (minutesSinceMidnight(shift.end_time) - minutesSinceMidnight(shift.start_time)) / 60)
    : 0;

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-foreground font-semibold mt-1">
            {shift ? `On shift ${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}` : "No shift scheduled today"}
          </p>
          <p className="text-sm text-primary mt-1">
            {next
              ? minsToNext! <= 0
                ? `${next.client_name} is due now`
                : `Next: ${next.client_name} in ${minsToNext! >= 60 ? `${Math.floor(minsToNext! / 60)}h ${minsToNext! % 60}m` : `${minsToNext} min`}`
              : "Nothing else booked today"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Appointments" value={String(bookings.length)} />
        <Stat label="Hours on shift" value={shiftHours ? shiftHours.toFixed(1) : "—"} />
        <Stat label="Completed" value={String(completed)} />
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={20} />}
          title="Nothing booked today"
          description="When your manager assigns you an appointment, it shows up here straight away."
        />
      ) : (
        <div className="space-y-2">
          {bookings.map((b, i) => {
            const start = minutesSinceMidnight(b.booking_time);
            const prev = i > 0 ? minutesSinceMidnight(bookings[i - 1].booking_time) : -1;
            const showNow = prev < nowMins && start >= nowMins;
            const done = ["completed", "no_show", "cancelled"].includes(b.status);
            return (
              <div key={b.id}>
                {showNow && (
                  <div className="flex items-center gap-2 py-2" aria-hidden>
                    <span className="h-px flex-1 bg-primary/40" />
                    <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">Now</span>
                    <span className="h-px flex-1 bg-primary/40" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(b)}
                  className="w-full text-left rounded-[16px] border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/50 transition-colors min-h-[64px]"
                >
                  <div className="w-14 shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatTime(b.booking_time)}</p>
                    <p className="text-[11px] text-muted-foreground">{b.duration_minutes}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {b.client_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{b.service}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="capitalize text-[10px] py-0">
                        {b.status.replace("_", " ")}
                      </Badge>
                      {b.party_size ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users size={11} /> {b.party_size}
                        </span>
                      ) : null}
                      {b.notes ? <span className="text-[11px] text-muted-foreground">Has notes</span> : null}
                    </div>
                  </div>
                  {b.status === "completed" ? (
                    <CheckCircle2 size={18} className="text-success shrink-0" />
                  ) : (
                    <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
            <Clock size={12} /> Tap an appointment to see details and update it
          </p>
        </div>
      )}
    </div>
  );
}
