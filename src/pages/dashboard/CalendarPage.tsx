import { useDashboardContext } from "@/hooks/useDashboardContext";
import CalendarView from "@/components/dashboard/CalendarView";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

export default function CalendarPage() {
  const ctx = useDashboardContext();
  if (!ctx) return null;
  return (
    <>
      <SEO title="Calendar — BookSuite" description="See your schedule at a glance." path="/dashboard/calendar" noIndex />
      <PageHeader title="Calendar" description="Weekly view of your bookings and availability." />
      <CalendarView userId={ctx.businessUserId} />
    </>
  );
}
