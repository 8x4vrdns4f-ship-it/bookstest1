import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { getConnectAuthHeaders } from "@/lib/connectPayments";

const PaymentsRefresh = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Re-generate an onboarding link and redirect there.
    getConnectAuthHeaders()
      .then((headers) =>
        supabase.functions.invoke("connect-create-account", {
          body: { origin: window.location.origin },
          headers,
        }),
      )
      .then(({ data, error }) => {
        if (error || !(data as any)?.url) { navigate("/payments", { replace: true }); return; }
        window.location.href = (data as any).url;
      })
      .catch(() => navigate("/payments", { replace: true }));
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );
};

export default PaymentsRefresh;
