import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface Props { children: ReactNode }

export default function RequireSubscription({ children }: Props) {
  const { loading, isActive } = useSubscription();
  const adminState = useIsAdmin();

  if (loading || adminState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Checking your subscription…
      </div>
    );
  }
  // Platform admins are never paywalled.
  if (!isActive && adminState !== "admin") {
    return <Navigate to="/pricing" replace />;
  }
  return <>{children}</>;
}
