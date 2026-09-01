import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props { children: ReactNode }

/**
 * Server-side admin gate: the role is read from the database (user_roles via
 * has_role policies), never from client storage, so it can't be spoofed.
 */
export default function AdminGuard({ children }: Props) {
  const [state, setState] = useState<"loading" | "admin" | "signedin" | "anon">("loading");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setState("anon"); return; }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      setState(error ? "signedin" : data ? "admin" : "signedin");
    };

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { check(); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

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
