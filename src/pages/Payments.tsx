import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import PaymentsCard from "@/components/dashboard/PaymentsCard";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS } from "@/lib/tierLimits";

const Payments = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const { tier } = useSubscription();
  const feePct = tier ? TIER_LIMITS[tier].feePercent : null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate("/auth"); return; }
      setUserId(data.user.id);
    });
  }, [navigate]);

  if (!userId) return null;

  return (
    <>
      <SEO title="Payments — BookSuite" description="Connect Stripe and manage payouts." path="/payments" noIndex />
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <CreditCard className="h-5 w-5" />
              </span>
              Payments
            </span>
          }
          description="Connect your Stripe account to start collecting booking deposits."
        />


        <PaymentsCard userId={userId} />

        <Card className="surface-card mt-6">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Connect Stripe — takes ~3 minutes (name, bank details, ID check).</p>
            <p>2. Customers pay the deposit you set in Settings when they book.</p>
            <p>3. Money lands in your Stripe balance and pays out to your bank weekly, every Monday.</p>
          </CardContent>
        </Card>

        <Card className="surface-card mt-6">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">How payouts and fees work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><span className="text-foreground font-medium">Payouts:</span> your earnings are paid to your bank weekly, every Monday (after Stripe's standard processing delay).</p>
            <p><span className="text-foreground font-medium">BookSuite's platform fee:</span> {feePct !== null ? `${feePct}% of each booking payment on your ${tier!.charAt(0).toUpperCase() + tier!.slice(1)} plan.` : "a percentage of each booking payment, set by your plan."}</p>
            <p><span className="text-foreground font-medium">Stripe's card fee:</span> from 1.5% + 20p for UK cards (more for premium, EU and international cards) is deducted from each payment.</p>
            <p><span className="text-foreground font-medium">Refunds:</span> when a booking is refunded, you return what you received for it. The card fees and BookSuite's platform fee aren't returned.</p>
            <p><span className="text-foreground font-medium">Chargebacks:</span> if a client disputes a payment with their bank, the disputed amount and Stripe's dispute fee (currently £20) are your responsibility.</p>
            <p><span className="text-foreground font-medium">Anything you owe</span> is taken from your future booking payments or added to your next subscription invoice. You'll see it in the "Owed to BookSuite" box above whenever there's a balance.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Payments;
