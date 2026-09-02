import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the right post-login route for the current signed-in user.
 * - Pending or declined join request, no employee link → /pending-approval
 * - Linked employee with role 'owner' or 'manager' → /dashboard
 * - Linked employee with role 'receptionist' → /dashboard (receptionist view)
 * - Linked employee (any other role) → /employee-dashboard
 * - Otherwise (business owner with business_settings) → /dashboard
 */
export const getDashboardRoute = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return "/auth";
  const uid = session.user.id;

  // Platform admin? Straight to the admin panel.
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  if (adminRole) return "/admin";


  // Linked employee?
  const { data: emp } = await supabase
    .from("employees")
    .select("id, role_id, company_roles:role_id(name)")
    .eq("auth_user_id", uid)
    .maybeSingle();
  if (emp) {
    const roleName = (emp as any).company_roles?.name ?? "employee";
    if (roleName === "owner" || roleName === "manager" || roleName === "receptionist") {
      return "/dashboard";
    }
    return "/employee-dashboard";
  }

  // Invited but not yet linked? Claim the seat the owner created for this email.
  const { data: claimed } = await supabase.rpc("claim_employee_seat_by_email");
  const claimedRow = Array.isArray(claimed) ? claimed[0] : claimed;
  if (claimedRow) {
    const roleName = (claimedRow as { role_name?: string }).role_name ?? "employee";
    if (roleName === "owner" || roleName === "manager" || roleName === "receptionist") {
      return "/dashboard";
    }
    return "/employee-dashboard";
  }


  // Business owner?
  const { data: biz } = await supabase
    .from("business_settings")
    .select("user_id, onboarding_completed_at")
    .eq("user_id", uid)
    .maybeSingle();
  if (biz) {
    if (!(biz as { onboarding_completed_at: string | null }).onboarding_completed_at) {
      return "/onboarding";
    }
    return "/dashboard";
  }

  // Otherwise check for pending/declined join request
  const { data: req } = await supabase
    .from("employee_join_requests")
    .select("status")
    .eq("requester_auth_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (req && (req.status === "pending" || req.status === "declined")) {
    return "/pending-approval";
  }

  return "/dashboard";
};
