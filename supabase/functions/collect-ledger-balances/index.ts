// Daily job: any tab a business has owed BookSuite for more than 14 days is
// added as an invoice item on its BookSuite subscription customer, so it is
// charged on the next subscription invoice. invoice.paid (webhook) records the
// 'collected' ledger row. Safe to run repeatedly: already-invoiced amounts are
// subtracted and the Stripe call uses a per-day idempotency key.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createStripeClient, resolveEnv } from "../_shared/stripe.ts";
import { amountToInvoiceMinor } from "../_shared/ledger-rules.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // Subscriptions live in one Stripe environment (live when configured).
    const env = resolveEnv(undefined);
    const stripe = createStripeClient(env);
    const today = new Date().toISOString().slice(0, 10);

    const { data: balances } = await admin.from("business_ledger_balances")
      .select("user_id, currency, balance_minor").eq("environment", env).gt("balance_minor", 0);

    const results: any[] = [];
    for (const b of balances ?? []) {
      const { data: rows } = await admin.from("business_ledger").select("amount_minor, created_at")
        .eq("user_id", b.user_id).eq("environment", env).eq("currency", b.currency);
      const { data: pend } = await admin.from("ledger_invoice_items").select("amount_minor")
        .eq("user_id", b.user_id).eq("environment", env).eq("currency", b.currency).eq("status", "pending");
      const pending = (pend ?? []).reduce((s: number, r: any) => s + Number(r.amount_minor), 0);
      const amount = amountToInvoiceMinor(rows ?? [], pending, Date.now(), 14);
      if (amount <= 0) continue;

      const { data: sub } = await admin.from("subscriptions").select("stripe_customer_id")
        .eq("user_id", b.user_id).not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!sub?.stripe_customer_id) { results.push({ user_id: b.user_id, skipped: "no subscription customer" }); continue; }

      try {
        const item = await stripe.invoiceItems.create({
          customer: sub.stripe_customer_id,
          amount,
          currency: String(b.currency).toLowerCase(),
          description: "Booking payment costs (refunds, chargebacks and card fees) owed to BookSuite",
          metadata: { booksuite_ledger: "1", user_id: b.user_id },
        }, { idempotencyKey: `ledger-${b.user_id}-${env}-${b.currency}-${today}-${amount}` });
        await admin.from("ledger_invoice_items").upsert({
          user_id: b.user_id, stripe_invoice_item_id: item.id, stripe_customer_id: sub.stripe_customer_id,
          amount_minor: amount, currency: String(b.currency).toUpperCase(), environment: env,
        }, { onConflict: "stripe_invoice_item_id", ignoreDuplicates: true });
        results.push({ user_id: b.user_id, invoiced_minor: amount, item: item.id });
      } catch (e) {
        console.error("invoice item failed", b.user_id, e);
        results.push({ user_id: b.user_id, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return json({ ok: true, env, results });
  } catch (e) {
    console.error("collect-ledger-balances error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
