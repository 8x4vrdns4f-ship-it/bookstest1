import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { getConnectAuthHeaders, getStripeEnvironment } from "@/lib/connectPayments";

const PaymentsReturn = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Refresh the account status, then go back to payments page.
    getConnectAuthHeaders()
      .then((headers) =>
        supabase.functions.invoke("connect-account-status", {
          body: { environment: getStripeEnvironment() },
          headers,
        }),
      )
      .finally(() => {
        navigate("/payments", { replace: true });
      });
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-accent mx-auto mb-3" size={32} />
        <p className="text-muted-foreground">Finalising your Stripe connection…</p>
      </div>
    </div>
  );
};

export default PaymentsReturn;
