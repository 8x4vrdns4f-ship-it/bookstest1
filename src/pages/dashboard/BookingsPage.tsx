import { useDashboardContext } from "@/hooks/useDashboardContext";
import BookingsList from "@/components/dashboard/BookingsList";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

export default function BookingsPage() {
  const ctx = useDashboardContext();
  if (!ctx) return null;
  return (
    <>
      <SEO title="Bookings — BookSuite" description="Manage every booking in one place." path="/dashboard/bookings" noIndex />
      <PageHeader title="Bookings" description="Every appointment, past and upcoming." />
      <BookingsList userId={ctx.businessUserId} />
    </>
  );
}
