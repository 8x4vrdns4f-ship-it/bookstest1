import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SectionCard from "@/components/app/SectionCard";
import DayScheduleDialog from "./DayScheduleDialog";
import DateOverrideDialog from "./DateOverrideDialog";
import BookingDetailDialog from "./BookingDetailDialog";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  client_name: string;
  client_email: string | null;
  service: string;
  status: string;
  notes: string | null;
  confirmation_code: string | null;
  assigned_employee_id: string | null;
};

type Override = { override_date: string; closed: boolean; open_time: string | null; close_time: string | null };

const CalendarView = ({ userId }: { userId: string }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overrideDate, setOverrideDate] = useState<Date | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<Booking | null>(null);

  const [defaultHours, setDefaultHours] = useState({ start: 9, end: 18 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const fetchAll = async () => {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${daysInMonth}`;
    const [bk, ov, st] = await Promise.all([
      supabase.from("bookings").select("*").gte("booking_date", startDate).lte("booking_date", endDate),
      supabase.from("date_overrides").select("override_date, closed, open_time, close_time").eq("user_id", userId).gte("override_date", startDate).lte("override_date", endDate),
      supabase.from("business_settings").select("day_start_hour, day_end_hour").eq("user_id", userId).maybeSingle(),
    ]);
    if (bk.data) setBookings(bk.data as Booking[]);
    if (ov.data) setOverrides(ov.data as Override[]);
    if (st.data) setDefaultHours({ start: st.data.day_start_hour ?? 9, end: st.data.day_end_hour ?? 18 });
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel(`calendar-bookings-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "date_overrides" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, daysInMonth, userId]);

  const dateStrFor = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getBookingsForDay = (day: number) => bookings.filter((b) => b.booking_date === dateStrFor(day));
  const getOverrideForDay = (day: number) => overrides.find((o) => o.override_date === dateStrFor(day));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
    setDialogOpen(true);
  };

  // Compute hours for the open day (override beats defaults)
  const hoursForSelected = (() => {
    if (!selectedDate) return defaultHours;
    const ds = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const ov = overrides.find((o) => o.override_date === ds);
    if (ov && !ov.closed && ov.open_time && ov.close_time) {
      return { start: parseInt(ov.open_time.slice(0, 2)), end: parseInt(ov.close_time.slice(0, 2)) || defaultHours.end };
    }
    return defaultHours;
  })();

  const selectedClosed = (() => {
    if (!selectedDate) return false;
    const ds = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return !!overrides.find((o) => o.override_date === ds)?.closed;
  })();

  return (
    <>
      <SectionCard
        title="Calendar"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1))}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[140px] text-center">{monthName}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month + 1))}>
              <ChevronRight size={16} />
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 mb-2 min-w-[560px]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-xs text-muted-foreground text-center py-1 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 min-w-[560px]">
            {days.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const dayBookings = getBookingsForDay(day);
              const ov = getOverrideForDay(day);
              const todayCls = isToday(day)
                ? "ring-1 ring-primary border-primary/60 bg-primary/5"
                : "border-border bg-secondary/30";
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[60px] p-1.5 rounded-md border text-xs text-left transition-colors hover:bg-primary/10 hover:border-primary/40 ${todayCls} ${ov?.closed ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}>{day}</span>
                    {ov && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto capitalize border-current">
                        {ov.closed ? "Closed" : "Custom"}
                      </Badge>
                    )}
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {dayBookings.slice(0, 3).map((_, i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[9px] text-primary font-medium">+{dayBookings.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Tip: click a day to view its schedule, set custom hours, or open bookings.
        </p>
      </SectionCard>

      <DayScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        bookings={bookings}
        startHour={hoursForSelected.start}
        endHour={hoursForSelected.end}
        closed={selectedClosed}
        onEditHours={() => {
          setOverrideDate(selectedDate);
          setOverrideOpen(true);
        }}
        onBookingClick={(b) => setBookingDetail(b as Booking)}
      />

      <DateOverrideDialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        date={overrideDate}
        userId={userId}
        onSaved={fetchAll}
      />

      <BookingDetailDialog
        booking={bookingDetail}
        open={!!bookingDetail}
        onOpenChange={(o) => !o && setBookingDetail(null)}
        ownerId={userId}
      />
    </>
  );
};

export default CalendarView;
