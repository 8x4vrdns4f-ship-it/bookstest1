import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface Props { children: ReactNode }

export default function RequireSubscription({ children }: Props) {
  const { loading, isActive } = useSubscription();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Checking your subscription…
      </div>
    );
  }
  if (!isActive) {
    return <Navigate to="/pricing" replace />;
  }
  return <>{children}</>;
}
