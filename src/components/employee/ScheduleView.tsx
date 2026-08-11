import EmptyState from "@/components/app/EmptyState";
import { CalendarDays } from "lucide-react";
import { EmployeeShift, TimeOffRequest, formatDay, formatTime, minutesSinceMidnight, todayISO } from "./types";

type Props = {
  shifts: EmployeeShift[];
  pastShifts: EmployeeShift[];
  bookingCountByDate: Record<string, number>;
  timeOff: TimeOffRequest[];
};

const ShiftRow = ({
  shift,
  count,
  today,
  muted,
  badge,
}: {
  shift: EmployeeShift;
  count: number;
  today: string;
  muted?: boolean;
  badge?: string | null;
}) => {
  const hours = Math.max(0, (minutesSinceMidnight(shift.end_time) - minutesSinceMidnight(shift.start_time)) / 60);
  return (
    <div
      className={`rounded-[16px] border border-border bg-card p-4 flex items-center justify-between gap-3 ${muted ? "opacity-70" : ""}`}
    >
      <div>
        <p className="text-foreground font-medium">
          {formatDay(shift.shift_date)}
          {shift.shift_date === today && <span className="text-primary text-xs ml-2">Today</span>}
          {badge && <span className="text-amber-400 text-xs ml-2">{badge}</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTime(shift.start_time)} – {formatTime(shift.end_time)} · {hours.toFixed(1)}h
        </p>
      </div>
      <p className="text-xs text-muted-foreground shrink-0">
        {count} {count === 1 ? "booking" : "bookings"}
      </p>
    </div>
  );
};

export default function ScheduleView({ shifts, pastShifts, bookingCountByDate, timeOff }: Props) {
  const today = todayISO();

  const badgeFor = (date: string) => {
    const match = timeOff.find((t) => t.start_date <= date && t.end_date >= date && t.status !== "declined");
    if (!match) return null;
    return match.status === "approved" ? "Time off" : "Time off requested";
  };

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold px-1">Next two weeks</p>
      {shifts.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={20} />}
          title="No upcoming shifts"
          description="Your manager hasn't scheduled you for the next two weeks yet. They'll appear here once they do."
        />
      ) : (
        shifts.map((s) => (
          <ShiftRow
            key={s.id}
            shift={s}
            today={today}
            count={bookingCountByDate[s.shift_date] || 0}
            badge={badgeFor(s.shift_date)}
          />
        ))
      )}

      {pastShifts.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold px-1 pt-4">Last 7 days</p>
          {pastShifts.map((s) => (
            <ShiftRow key={s.id} shift={s} today={today} count={bookingCountByDate[s.shift_date] || 0} muted />
          ))}
        </>
      )}

      <p className="text-[11px] text-muted-foreground text-center pt-2">
        Shifts are set by your manager. Request time off from your Profile tab.
      </p>
    </div>
  );
}
