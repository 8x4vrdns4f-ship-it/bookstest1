import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminState = "loading" | "admin" | "signedin" | "anon";

/**
 * Server-side admin check: the role is read from the database (user_roles),
 * never from client storage, so it can't be spoofed.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !error && !!data;
}

export function useIsAdmin() {
  const [state, setState] = useState<AdminState>("loading");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setState("anon"); return; }
      const isAdmin = await checkIsAdmin();
      if (cancelled) return;
      setState(isAdmin ? "admin" : "signedin");
    };

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { check(); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
