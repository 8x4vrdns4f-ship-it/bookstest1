// Shared rate limiter for public, unauthenticated edge functions.
// Backed by public.check_rate_limit (service-role only).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export type RateLimitRule = {
  bucket: string;
  /** Max hits allowed inside the window. */
  max: number;
  /** Rolling window length in seconds. */
  windowSeconds: number;
};

export const getClientIp = (req: Request): string => {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",")[0]?.trim();
  return first || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
};

const adminClient = (): SupabaseClient =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

/**
 * Returns true when the caller is allowed. Fails open on infrastructure errors
 * so a limiter outage never blocks real bookings.
 */
export const checkRateLimit = async (
  rule: RateLimitRule,
  identifier: string | null | undefined,
  admin?: SupabaseClient,
): Promise<boolean> => {
  if (!identifier) return true;
  try {
    const client = admin ?? adminClient();
    const { data, error } = await client.rpc("check_rate_limit", {
      p_bucket: rule.bucket,
      p_identifier: String(identifier).slice(0, 200).toLowerCase(),
      p_max_hits: rule.max,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) {
      console.error("rate limit check failed", error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.error("rate limit check threw", e);
    return true;
  }
};

/** Checks several identifiers (e.g. IP and email) against the same rule. */
export const checkRateLimits = async (
  checks: Array<{ rule: RateLimitRule; identifier: string | null | undefined }>,
  admin?: SupabaseClient,
): Promise<boolean> => {
  const client = admin ?? adminClient();
  for (const c of checks) {
    const ok = await checkRateLimit(c.rule, c.identifier, client);
    if (!ok) return false;
  }
  return true;
};

export const rateLimited = (corsHeaders: Record<string, string>, retryAfterSeconds = 60) =>
  new Response(
    JSON.stringify({
      error: "Too many attempts. Please wait a moment and try again.",
      code: "RATE_LIMITED",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );

export const RATE_RULES = {
  contact: { bucket: "contact", max: 5, windowSeconds: 3600 } as RateLimitRule,
  booking: { bucket: "booking", max: 10, windowSeconds: 900 } as RateLimitRule,
  waitlist: { bucket: "waitlist", max: 8, windowSeconds: 3600 } as RateLimitRule,
  review: { bucket: "review", max: 10, windowSeconds: 3600 } as RateLimitRule,
  assistant: { bucket: "assistant", max: 20, windowSeconds: 3600 } as RateLimitRule,
};
