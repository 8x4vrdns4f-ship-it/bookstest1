// Shared helpers for the customer bookings portal (magic-link sessions).
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 320) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

/** Resolves the portal session token to a verified email, or null. */
export async function resolveSession(
  admin: SupabaseClient,
  sessionToken: unknown,
): Promise<string | null> {
  if (typeof sessionToken !== "string" || sessionToken.length < 32) return null;
  const hash = await sha256(sessionToken);
  const { data } = await admin
    .from("client_portal_sessions")
    .select("email, session_expires_at")
    .eq("session_token_hash", hash)
    .maybeSingle();
  if (!data) return null;
  if (!data.session_expires_at || new Date(data.session_expires_at) < new Date()) return null;
  return data.email as string;
}

export function formatDate(d: string): string {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return d; }
}

export function formatTime(t: string): string {
  return (t || "").slice(0, 5);
}
