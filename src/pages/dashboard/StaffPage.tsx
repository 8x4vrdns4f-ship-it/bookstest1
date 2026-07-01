import { useDashboardContext } from "@/hooks/useDashboardContext";
import StaffList from "@/components/dashboard/StaffList";
import AddEmployeeDialog from "@/components/dashboard/AddEmployeeDialog";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

export default function StaffPage() {
  const ctx = useDashboardContext();
  if (!ctx) return null;
  return (
    <>
      <SEO title="Staff — BookSuite" description="Manage your team." path="/dashboard/staff" noIndex />
      <PageHeader
        title="Staff"
        description="Invite teammates and manage their access."
        actions={ctx.isOwner ? <AddEmployeeDialog userId={ctx.user.id} /> : undefined}
      />
      <StaffList userId={ctx.businessUserId} />
    </>
  );
}
