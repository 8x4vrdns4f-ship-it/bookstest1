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
      <PageHeader title="Shifts" description="Plan the week for your team." />
      <ShiftsView userId={ctx.businessUserId} />
    </>
  );
}
