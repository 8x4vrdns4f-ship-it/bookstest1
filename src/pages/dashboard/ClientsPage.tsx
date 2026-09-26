import { useDashboardContext } from "@/hooks/useDashboardContext";
import ClientList from "@/components/dashboard/ClientList";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

export default function ClientsPage() {
  const ctx = useDashboardContext();
  if (!ctx) return null;
  return (
    <>
      <SEO title="Clients — BookSuite" description="Your client database." path="/dashboard/clients" noIndex />
      <PageHeader
        title="Clients"
        description="Everyone who has booked with you. Clients are added automatically when someone books — or import your existing list from another tool in one go."
      />
      <ClientList userId={ctx.businessUserId} />
    </>
  );
}
