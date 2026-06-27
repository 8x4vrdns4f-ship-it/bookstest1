import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getConnectAuthHeaders, getConnectErrorMessage, getStripeEnvironment } from "@/lib/connectPayments";

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

  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <CreditCard className="text-accent" size={20} />
          </div>
          <div>
            <CardTitle className="text-foreground">Payments</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Collect deposits at booking time and route money to your bank.
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="animate-spin text-muted-foreground" size={18} />
        ) : ready ? (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 gap-1">
            <CheckCircle2 size={12} /> Active
          </Badge>
        ) : status?.connected ? (
          <Badge variant="outline" className="border-yellow-500/40 text-yellow-400 gap-1">
            <AlertCircle size={12} /> Onboarding incomplete
          </Badge>
        ) : (
          <Badge variant="outline" className="border-border text-muted-foreground">Not connected</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {!status?.connected && (
          <Button onClick={startOnboarding} disabled={actionLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Connect Stripe
          </Button>
        )}
        {status?.connected && !ready && (
          <Button onClick={startOnboarding} disabled={actionLoading} variant="outline">
            {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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
        {!ready && status?.connected && (
          <p className="text-xs text-muted-foreground w-full">
            Stripe still needs more details before you can accept payments. Click "Finish onboarding".
          </p>
        )}
        {!status?.connected && !loading && (
          <p className="text-xs text-muted-foreground w-full">
            Until you connect Stripe, customers cannot book through your widget.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentsCard;
