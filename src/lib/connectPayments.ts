import { supabase } from "@/integrations/supabase/client";

export const getConnectAuthHeaders = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error("Could not read your login session. Please log in again.");
  }

  if (!session?.access_token) {
    throw new Error("Please log in again to connect Stripe.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
};

export const getConnectErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message || "");
    return message || fallback;
  }
  return fallback;
};