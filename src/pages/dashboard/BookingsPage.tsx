import { useDashboardContext } from "@/hooks/useDashboardContext";
import BookingsList from "@/components/dashboard/BookingsList";
import BookingRequestsCard from "@/components/dashboard/BookingRequestsCard";
import WaitlistCard from "@/components/dashboard/WaitlistCard";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

export default function BookingsPage() {
  const ctx = useDashboardContext();
  if (!ctx) return null;
  return (
    <>
      <SEO title="Bookings — BookSuite" description="Manage every booking in one place." path="/dashboard/bookings" noIndex />
      <PageHeader title="Bookings" description="Every appointment, past and upcoming." />
      <div className="space-y-4">
        <BookingRequestsCard userId={ctx.businessUserId} />
        <WaitlistCard userId={ctx.businessUserId} />
        <BookingsList userId={ctx.businessUserId} />
      </div>
    </>
  );
}

