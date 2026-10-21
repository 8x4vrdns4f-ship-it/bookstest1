import { useDashboardContext } from "@/hooks/useDashboardContext";
import ShiftsView from "@/components/dashboard/ShiftsView";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

export default function ShiftsPage() {
  const ctx = useDashboardContext();
  if (!ctx) return null;
  return (
    <>
      <SEO title="Shifts — BookSuite" description="Plan and manage staff shifts." path="/dashboard/shifts" noIndex />
      <PageHeader title="Shifts" description="Set each person's usual week once: pick the days they normally work and their hours, then press Save. That becomes their regular schedule and keeps repeating, with no end date. You can change it any time, or click a single day to make a one-off change." />
      <ShiftsView userId={ctx.businessUserId} />
    </>
  );
}
