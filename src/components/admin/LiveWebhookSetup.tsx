import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { Webhook, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Endpoint = { scope: string; url: string; created: boolean; signing_secret: string | null; secret_env_var: string; endpoint_id: string };

/** Admin-only: (re)registers BookSuite's LIVE Stripe webhooks. A new endpoint's
 *  signing secret is shown once here so it never passes through chat or logs. */
export default function LiveWebhookSetup() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ events: string[]; endpoints: Endpoint[] } | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-stripe-webhook", { body: { env: "live" } });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setResult(data as any);
    } catch (e: any) {
      toast.error(e.message || "Webhook setup failed");
    } finally { setBusy(false); }
  };

  return (
    <SectionCard icon={<Webhook size={20} />} title="Live Stripe webhooks" description="Registers BookSuite's live payment listeners (connected accounts + platform). Safe to run again.">
      <Button onClick={run} disabled={busy} variant="outline">
        {busy && <Loader2 className="animate-spin" size={16} />} Set up live webhooks
      </Button>
      {result && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-muted-foreground">Listening to: {result.events.join(", ")}</p>
          {result.endpoints.map((e) => (
            <div key={e.endpoint_id} className="rounded-lg border border-border p-3 space-y-1">
              <p className="font-medium text-foreground">{e.scope === "platform" ? "Platform account" : "Connected accounts"} — {e.created ? "created" : "already existed, events updated"}</p>
              {e.signing_secret ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Copy this now (shown only once) and save it in Project Settings → Secrets as <code className="text-foreground">{e.secret_env_var}</code>:</p>
                  <Button size="sm" variant="secondary" className="gap-2" onClick={() => { navigator.clipboard.writeText(e.signing_secret!); toast.success("Signing secret copied"); }}>
                    <Copy size={14} /> Copy signing secret
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No new secret — the one saved as {e.secret_env_var} is still used.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
