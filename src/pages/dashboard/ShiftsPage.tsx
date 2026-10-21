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
      <PageHeader title="Shifts" description="See who works when. Set each person's usual week, then click any day for one-off changes." />
      <ShiftsView userId={ctx.businessUserId} />
    </>
  );
}
