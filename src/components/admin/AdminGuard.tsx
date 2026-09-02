import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface Props { children: ReactNode }

/**
 * Server-side admin gate: the role is read from the database (user_roles via
 * has_role policies), never from client storage, so it can't be spoofed.
 */
export default function AdminGuard({ children }: Props) {
  const state = useIsAdmin();

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (state === "anon") return <Navigate to="/auth" replace />;
  if (state === "signedin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
