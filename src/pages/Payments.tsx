import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import PaymentsCard from "@/components/dashboard/PaymentsCard";
import PageHeader from "@/components/app/PageHeader";
import SEO from "@/components/SEO";

const Payments = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

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
            </span> as any
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
            <p>3. Money lands in your Stripe balance and pays out to your bank.</p>
            <p>
              BookSuite takes a small platform fee from each deposit (configured per your plan).
              Stripe's processing fees come out of your share — see Stripe's pricing for the
              exact rates in your country.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Payments;
