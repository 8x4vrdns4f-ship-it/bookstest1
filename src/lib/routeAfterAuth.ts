import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the right dashboard route for the current signed-in user.
 * - Linked employee row → /employee-dashboard
 * - Otherwise (owner) → /dashboard
 */
export const getDashboardRoute = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return "/auth";
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();
  return data ? "/employee-dashboard" : "/dashboard";
};
