import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props { children: ReactNode }

export default function RequireVerifiedEmail({ children }: Props) {
  const [state, setState] = useState<"loading" | "verified" | "unverified" | "anon">("loading");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) setState("anon");
      else if (user.email_confirmed_at) setState("verified");
      else setState("unverified");
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (!u) setState("anon");
      else if (u.email_confirmed_at) setState("verified");
      else setState("unverified");
    });
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
  if (state === "unverified") return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
}
