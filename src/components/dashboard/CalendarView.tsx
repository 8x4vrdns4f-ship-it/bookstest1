import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Booking = {
  booking_date: string;
  booking_time: string;
  client_name: string;
  service: string;
  status: string;
};

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  useEffect(() => {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${daysInMonth}`;

    supabase
      .from("bookings")
      .select("booking_date, booking_time, client_name, service, status")
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .then(({ data }) => {
        if (data) setBookings(data);
      });
  }, [year, month, daysInMonth]);

  const getBookingsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter((b) => b.booking_date === dateStr);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1))}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center">{monthName}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month + 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-xs text-muted-foreground text-center py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;
            const dayBookings = getBookingsForDay(day);
            return (
              <div
                key={day}
                className={`min-h-[60px] p-1 rounded-md border text-xs ${
                  isToday(day)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30"
                }`}
              >
                <span className={`font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}>{day}</span>
                {dayBookings.slice(0, 2).map((b, i) => (
                  <div key={i} className="mt-0.5 truncate text-[10px] text-muted-foreground bg-primary/10 rounded px-1">
                    {b.booking_time.slice(0, 5)} {b.client_name}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-[10px] text-primary">+{dayBookings.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
