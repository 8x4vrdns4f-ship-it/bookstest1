import { useEffect, useState } from "react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import CalendarView from "@/components/dashboard/CalendarView";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";
import BookingLinkCard from "@/components/dashboard/BookingLinkCard";
import { supabase } from "@/integrations/supabase/client";

export default function CalendarPage() {
  const ctx = useDashboardContext();
  const [hasBookings, setHasBookings] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ctx) return;
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.businessUserId)
      .then(({ count }) => setHasBookings((count || 0) > 0));
  }, [ctx]);

  if (!ctx) return null;
  return (
    <>
      <SEO title="Calendar — BookSuite" description="See your schedule at a glance." path="/dashboard/calendar" noIndex />
      <PageHeader title="Calendar" description="Weekly view of your bookings and availability." />
      <div className="space-y-6">
        {ctx.isOwner && hasBookings === false && (
          <BookingLinkCard
            userId={ctx.user.id}
            title="Your calendar is empty"
            description="Nothing is booked yet. Share your link and bookings will appear here automatically."
          />
        )}
        <CalendarView userId={ctx.businessUserId} />
      </div>
    </>
  );
}
