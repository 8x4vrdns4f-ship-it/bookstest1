import EmptyState from "@/components/app/EmptyState";
import { CalendarDays } from "lucide-react";
import { EmployeeShift, formatDay, formatTime, minutesSinceMidnight, todayISO } from "./types";

type Props = {
  shifts: EmployeeShift[];
  bookingCountByDate: Record<string, number>;
};

export default function ScheduleView({ shifts, bookingCountByDate }: Props) {
  const today = todayISO();

  if (shifts.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays size={20} />}
        title="No upcoming shifts"
        description="Your manager hasn't scheduled you for the next two weeks yet. They'll appear here once they do."
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold px-1">Next two weeks</p>
      {shifts.map((s) => {
        const hours = Math.max(0, (minutesSinceMidnight(s.end_time) - minutesSinceMidnight(s.start_time)) / 60);
        const count = bookingCountByDate[s.shift_date] || 0;
        return (
          <div
            key={s.id}
            className="rounded-[16px] border border-border bg-card p-4 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-foreground font-medium">
                {formatDay(s.shift_date)}
                {s.shift_date === today && <span className="text-primary text-xs ml-2">Today</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTime(s.start_time)} – {formatTime(s.end_time)} · {hours.toFixed(1)}h
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {count} {count === 1 ? "booking" : "bookings"}
            </p>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground text-center pt-2">
        Shifts are set by your manager. Ask them for any changes.
      </p>
    </div>
  );
}
