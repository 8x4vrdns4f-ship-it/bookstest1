import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import PaymentsCard from "@/components/dashboard/PaymentsCard";

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6 -ml-3">
          <Link to="/dashboard"><ArrowLeft size={16} className="mr-2" /> Back to Dashboard</Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="text-accent" size={28} />
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Connect your Stripe account to start collecting booking deposits.
        </p>

        <PaymentsCard userId={userId} />

        <Card className="bg-card border-border">
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
    </div>
  );
};

export default Payments;
