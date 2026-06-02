import { Helmet } from "react-helmet-async";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tiers = [
  {
    name: "Silver",
    tier: "silver" as const,
    price: "£199",
    period: "/mo",
    features: ["Up to 50 bookings/mo", "1 staff member", "Email support", "Basic analytics", "12.5% fee per successful booking"],
    accent: "from-zinc-400 to-zinc-300",
    badge: "bg-zinc-400/20 text-zinc-300",
  },
  {
    name: "Gold",
    tier: "gold" as const,
    price: "£549",
    period: "/mo",
    features: ["Up to 300 bookings/mo", "10 staff members", "Priority support", "Advanced analytics", "Custom branding", "7.5% fee per transaction"],
    accent: "from-yellow-500 to-amber-400",
    badge: "bg-yellow-500/20 text-yellow-300",
    popular: true,
  },
  {
    name: "Platinum",
    tier: "platinum" as const,
    price: "£1,195",
    period: "/mo",
    features: ["Unlimited bookings", "Unlimited staff", "24/7 dedicated support", "Full analytics suite", "Custom branding", "API access", "2.5% fee per transaction"],
    accent: "from-cyan-400 to-blue-300",
    badge: "bg-cyan-400/20 text-cyan-200",
  },
];

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubscribe = async (tier: "silver" | "gold" | "platinum") => {
    setLoading(tier);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.info("Please sign up or log in to subscribe");
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { tier } });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
    } finally {
      setLoading(null);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing — BookSuite"
        description="BookSuite pricing plans for service businesses. Silver, Gold, and Platinum tiers with transparent transaction fees and staff limits."
        path="/pricing"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "BookSuite",
          description: "All-in-one booking platform for small service businesses.",
          brand: { "@type": "Brand", name: "BookSuite" },
          offers: tiers.map((t) => ({
            "@type": "Offer",
            name: t.name,
            price: t.price.replace(/[^0-9.]/g, ""),
            priceCurrency: "USD",
            url: "https://booksuite.online/pricing",
            availability: "https://schema.org/InStock",
          })),
        })}</script>
      </Helmet>
      <Navbar />
      <main>
      <section className="px-8 md:px-16 pt-32 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          <span className="text-primary">Choose</span>{" "}
          <span className="text-foreground">Your Plan</span>
        </h1>
        <p className="text-muted-foreground text-center mb-4 max-w-lg mx-auto">
          Pick the tier that fits your business. Upgrade or downgrade anytime.
        </p>
        <p className="text-center text-sm text-primary mb-16">
          ✨ Start with a <span className="font-semibold">30-day free trial</span> on any plan — card required, cancel anytime before it ends.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative bg-secondary/60 border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 ${
                tier.popular ? "ring-1 ring-primary/50" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`inline-block mx-auto mb-3 px-4 py-1 rounded-full text-xs font-semibold ${tier.badge}`}>
                  {tier.name}
                </div>
                <CardTitle className="text-4xl font-bold text-foreground">
                  {tier.price}
                  <span className="text-sm font-normal text-muted-foreground">{tier.period}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(tier.tier)}
                  disabled={loading === tier.tier}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                >
                  {loading === tier.tier ? "Loading..." : "Get Started"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
