import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AssistantPanel, { DATA_CHANGED_EVENT } from "@/components/dashboard/AssistantPanel";

export default function AppLayout() {
  const ctx = useDashboardContext();
  // Remount the current page after the assistant applies changes so it shows fresh data.
  const [dataVersion, setDataVersion] = useState(0);
  useEffect(() => {
    const h = () => setDataVersion((v) => v + 1);
    window.addEventListener(DATA_CHANGED_EVENT, h);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, h);
  }, []);

  return (
    <NotificationsProvider
      businessUserId={ctx?.businessUserId ?? null}
      authUserId={ctx?.user.id ?? null}
    >
      <SidebarProvider defaultOpen>
        <div className="min-h-screen flex w-full bg-background text-foreground">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeader />
            <main className="flex-1 overflow-x-hidden">
              <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8">
                <ErrorBoundary>
                  <Outlet key={dataVersion} />
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
        {ctx?.isOwner && <AssistantPanel />}
      </SidebarProvider>
    </NotificationsProvider>
  );
}
