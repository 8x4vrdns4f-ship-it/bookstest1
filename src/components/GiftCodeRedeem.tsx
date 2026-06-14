import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { toast } from "sonner";

const GiftCodeRedeem = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.info("Please log in or sign up to redeem a gift code");
        navigate("/auth");
        return;
      }

      const { data, error } = await (supabase as any).rpc("redeem_gift_code", { p_code: trimmed });
      if (error) {
        const msg = error.message || "Could not redeem code";
        if (msg.includes("INVALID_CODE")) toast.error("That gift code is not valid");
        else if (msg.includes("ALREADY_USED")) toast.error("That code has already been redeemed");
        else if (msg.includes("ACTIVE_GIFT")) toast.error("You already have an active gift subscription");
        else toast.error(msg);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const tier = row?.out_tier ?? row?.tier;
      toast.success(`Gift redeemed! You now have 30 days of ${tier?.toUpperCase?.() ?? "full"} access.`);
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Could not redeem code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto bg-secondary/60 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Gift className="text-primary" size={20} />
          Got a gift code?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your code below to start your free 30-day subscription with full access.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="GIFT-XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="bg-background uppercase tracking-wider"
            maxLength={20}
          />
          <Button
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Redeeming…" : "Redeem"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftCodeRedeem;
