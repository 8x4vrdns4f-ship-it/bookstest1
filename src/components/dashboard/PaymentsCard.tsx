import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getConnectAuthHeaders, getConnectErrorMessage, getStripeEnvironment } from "@/lib/connectPayments";
import SectionCard from "@/components/app/SectionCard";

type Status = {
  connected: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  stripe_account_id?: string;
};

const PaymentsCard = ({ userId }: { userId: string }) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = async () => {
    try {
      const headers = await getConnectAuthHeaders();
      const { data, error } = await supabase.functions.invoke("connect-account-status", {
        body: { environment: getStripeEnvironment() },
        headers,
      });
      if (error) throw error;
      setStatus(data as Status);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [userId]);

  const startOnboarding = async () => {
    setActionLoading(true);
    try {
      const headers = await getConnectAuthHeaders();
      const { data, error } = await supabase.functions.invoke("connect-create-account", {
        body: { origin: window.location.origin, environment: getStripeEnvironment() },
        headers,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if (!(data as any)?.url) throw new Error("Stripe returned no onboarding link.");
      window.location.href = (data as any).url;
    } catch (e: any) {
      toast.error(getConnectErrorMessage(e, "Stripe onboarding could not be started."));
      setActionLoading(false);
    }
  };

  const openStripeDashboard = async () => {
    setActionLoading(true);
    try {
      const headers = await getConnectAuthHeaders();
      const { data, error } = await supabase.functions.invoke("connect-dashboard-link", {
        body: { environment: getStripeEnvironment() },
        headers,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if (!(data as any)?.url) throw new Error("Stripe returned no dashboard link.");
      window.open((data as any).url, "_blank");
    } catch (e: any) {
      toast.error(getConnectErrorMessage(e, "Could not open Stripe dashboard."));
    } finally {
      setActionLoading(false);
    }
  };

  const ready = status?.connected && status?.charges_enabled;

  const statusBadge = loading ? (
    <Loader2 className="animate-spin text-muted-foreground" size={18} />
  ) : ready ? (
    <Badge className="bg-success/20 text-success border-success/40 gap-1">
      <CheckCircle2 size={12} /> Active
    </Badge>
  ) : status?.connected ? (
    <Badge variant="outline" className="border-warning/40 text-warning gap-1">
      <AlertCircle size={12} /> Onboarding incomplete
    </Badge>
  ) : (
    <Badge variant="outline" className="border-border text-muted-foreground">Not connected</Badge>
  );

  return (
    <SectionCard
      className="mb-6"
      icon={<CreditCard size={20} />}
      title="Payments"
      description="Collect deposits at booking time and route money to your bank."
      actions={statusBadge}
    >
      <div className="flex flex-wrap items-center gap-3">
        {!status?.connected && (
          <Button onClick={startOnboarding} disabled={actionLoading} variant="premium">
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
            Connect Stripe
          </Button>
        )}
        {status?.connected && !ready && (
          <Button onClick={startOnboarding} disabled={actionLoading} variant="outline">
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
            Finish onboarding
          </Button>
        )}
        {ready && (
          <>
            <Button onClick={openStripeDashboard} disabled={actionLoading} variant="outline" className="gap-2">
              <ExternalLink size={14} /> Manage on Stripe
            </Button>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              Refresh status
            </Button>
          </>
        )}
        {!ready && !loading && (
          <div className="flex gap-2.5 w-full rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
            <p>
              Your booking link is not accepting bookings yet. Customers see "not taking bookings" until
              payment setup is finished.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default PaymentsCard;
