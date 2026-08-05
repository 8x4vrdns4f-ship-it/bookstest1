import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type RoleInfo = { name: string; canApprove: boolean };

export type DashboardContext = {
  user: User;
  businessUserId: string;
  displayName: string;
  role: RoleInfo;
  isOwner: boolean;
};

/**
 * Resolves the current authed user, their business owner id, and role.
 * Redirects to /auth if not signed in.
 */
export function useDashboardContext() {
  const navigate = useNavigate();
  const [ctx, setCtx] = useState<DashboardContext | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async (session: any) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      const u: User = session.user;
      const displayName =
        (u.user_metadata?.display_name as string) ||
        (u.email ? u.email.split("@")[0] : "") ||
        "";


      const { data: emp } = await supabase
        .from("employees")
        .select("user_id, company_roles:role_id(name, can_approve_requests)")
        .eq("auth_user_id", u.id)
        .maybeSingle();

      let businessUserId = u.id;
      let role: RoleInfo = { name: "owner", canApprove: true };
      if (emp) {
        businessUserId = (emp as any).user_id;
        const cr = (emp as any).company_roles;
        role = { name: cr?.name ?? "employee", canApprove: !!cr?.can_approve_requests };
      }

      if (!mounted) return;
      setCtx({
        user: u,
        businessUserId,
        displayName,
        role,
        isOwner: role.name === "owner",
      });
    };

    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return ctx;
}
