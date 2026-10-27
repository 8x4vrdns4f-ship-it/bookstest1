import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Row = { account: string; env: string; status: string; error?: string };

/** Admin-only: moves every connected account to weekly (Monday) payouts. Safe to re-run. */
export default function WeeklyPayoutsSetup() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-payout-schedules", { body: {} });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setRows((data as any).results);
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    } finally { setBusy(false); }
  };

  return (
    <SectionCard icon={<CalendarClock size={20} />} title="Weekly payouts" description="Sets every connected business to weekly payouts every Monday. Safe to run again.">
      <Button onClick={run} disabled={busy} variant="outline">
        {busy && <Loader2 className="animate-spin" size={16} />} Switch all to weekly payouts
      </Button>
      {rows && (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {rows.length === 0 && <li>No connected accounts.</li>}
          {rows.map((r) => (
            <li key={r.account + r.env}>{r.env} · {r.account}: <span className="text-foreground">{r.status}</span>{r.error ? ` — ${r.error}` : ""}</li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
