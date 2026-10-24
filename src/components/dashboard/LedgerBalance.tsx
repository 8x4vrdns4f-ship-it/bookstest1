import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

type Row = {
  id: string;
  booking_id: string | null;
  type: string;
  amount_minor: number;
  currency: string;
  environment: string;
  note: string | null;
  created_at: string;
};

export const LEDGER_REASON: Record<string, string> = {
  stripe_fee_shortfall: "Card fee above standard rate",
  refund_shortfall: "Refund not fully recovered",
  unreversed_refund: "Refund not recovered from your balance",
  dispute_amount: "Chargeback not recovered from your balance",
  dispute_fee: "Stripe chargeback fee",
  dispute_won_credit: "Chargeback won — credit",
  collected: "Paid off",
};

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(minor / 100);

/** "Owed to BookSuite" balance + breakdown. Renders nothing when the balance is zero. */
export default function LedgerBalance({ userId, title = "Owed to BookSuite" }: { userId: string; title?: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("business_ledger")
        .select("id, booking_id, type, amount_minor, currency, environment, note, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
      if (!alive) return;
      const list = (data ?? []) as Row[];
      setRows(list);
      const ids = [...new Set(list.map((r) => r.booking_id).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: b } = await supabase.from("bookings").select("id, client_name, booking_date").in("id", ids);
        if (alive) setLabels(Object.fromEntries((b ?? []).map((x) => [x.id, `${x.client_name} · ${new Date(x.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`])));
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  if (!rows?.length) return null;
  const groups = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.environment}|${r.currency}`;
    groups.set(k, (groups.get(k) ?? 0) + r.amount_minor);
  }
  const owing = [...groups.entries()].filter(([, v]) => v !== 0);
  if (!owing.length) return null;

  return (
    <div className="w-full rounded-xl border border-warning/40 bg-warning/10 p-3 space-y-2">
      {owing.map(([k, v]) => {
        const [env, currency] = k.split("|");
        return (
          <p key={k} className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {v > 0 ? `${title}: ${money(v, currency)}` : `Credit from BookSuite: ${money(-v, currency)}`}
            {env === "sandbox" && <span className="text-xs text-muted-foreground">(test mode)</span>}
          </p>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Costs from refunds, chargebacks and premium-card fees on your booking payments. It's taken from your next
        booking payments (you always keep at least half of each) or added to your next BookSuite invoice after 14 days.
      </p>
      <ul className="divide-y divide-border text-xs">
        {rows.slice(0, 20).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground w-20 shrink-0">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>
            <span className="flex-1 min-w-0 truncate">
              {LEDGER_REASON[r.type] ?? r.type}
              {r.booking_id && labels[r.booking_id] ? <span className="text-muted-foreground"> — {labels[r.booking_id]}</span> : null}
            </span>
            <span className={r.amount_minor < 0 ? "text-success font-medium" : "font-medium"}>
              {r.amount_minor < 0 ? "−" : ""}{money(Math.abs(r.amount_minor), r.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
