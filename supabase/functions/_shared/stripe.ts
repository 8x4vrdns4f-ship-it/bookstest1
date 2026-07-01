import Stripe from "https://esm.sh/stripe@22.0.2";

const getEnv = (key: string): string => {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`${key} is not configured`);
  return v;
};

export type StripeEnv = "sandbox" | "live";

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

export function getConnectionApiKey(env: StripeEnv): string {
  return env === "sandbox"
    ? getEnv("STRIPE_SANDBOX_API_KEY")
    : getEnv("STRIPE_LIVE_API_KEY");
}

export function createStripeClient(env: StripeEnv): Stripe {
  const connectionApiKey = getConnectionApiKey(env);
  const lovableApiKey = getEnv("LOVABLE_API_KEY");
  return new Stripe(connectionApiKey, {
    apiVersion: "2026-03-25.dahlia" as any,
    httpClient: Stripe.createFetchHttpClient((url: string | URL, init?: RequestInit) => {
      const gatewayUrl = url.toString().replace("https://api.stripe.com", GATEWAY_STRIPE_BASE);
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers).entries()),
          "X-Connection-Api-Key": connectionApiKey,
          "Lovable-API-Key": lovableApiKey,
        },
      });
    }),
  });
}

export function resolveEnv(input: unknown): StripeEnv {
  if (input === "live" || input === "sandbox") return input;
  // fallback: prefer live if configured, else sandbox
  return Deno.env.get("STRIPE_LIVE_API_KEY") ? "live" : "sandbox";
}

export async function resolvePriceIdByLookupKey(stripe: Stripe, lookupKey: string): Promise<string> {
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (!prices.data.length) throw new Error(`Price not found for lookup_key: ${lookupKey}`);
  return prices.data[0].id;
}

/**
 * Validate a caller-supplied `origin` string against an allowlist of trusted
 * hosts (BookSuite production, previews, sandbox) and Lovable preview domains.
 * Returns the sanitized origin if allowed, otherwise the provided fallback.
 * Prevents open-redirect abuse via Stripe success_url / cancel_url.
 */
export function sanitizeOrigin(
  candidate: unknown,
  fallback: string = "https://booksuite.online",
): string {
  const raw = typeof candidate === "string" ? candidate.trim() : "";
  if (!raw) return fallback;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fallback;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return fallback;
  const host = url.hostname.toLowerCase();
  const allowed =
    host === "booksuite.online" ||
    host.endsWith(".booksuite.online") ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovable.dev") ||
    host === "localhost" ||
    host === "127.0.0.1";
  if (!allowed) return fallback;
  return `${url.protocol}//${url.host}`;
}

