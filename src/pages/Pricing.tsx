import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GiftCodeRedeem from "@/components/GiftCodeRedeem";
import { useLocale } from "@/contexts/LocaleContext";

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t, formatPrice, currency } = useLocale();

  const tiers = [
    {
      name: "Silver", tier: "silver" as const, gbp: 20,
      features: [t("pricing.f.silver_bookings"), t("pricing.f.silver_staff"), t("pricing.f.email_support"), t("pricing.f.basic_analytics"), `12.5% ${t("pricing.fee")}`],
      badge: "bg-zinc-400/20 text-zinc-300",
    },
    {
      name: "Gold", tier: "gold" as const, gbp: 59,
      features: [t("pricing.f.gold_bookings"), t("pricing.f.gold_staff"), t("pricing.f.priority_support"), t("pricing.f.advanced_analytics"), t("pricing.f.custom_branding"), `5% ${t("pricing.fee")}`],
      badge: "bg-yellow-500/20 text-yellow-300", popular: true,
    },
    {
      name: "Platinum", tier: "platinum" as const, gbp: 199,
      features: [t("pricing.f.unlimited_bookings"), t("pricing.f.unlimited_staff"), t("pricing.f.dedicated_support"), t("pricing.f.full_analytics"), t("pricing.f.custom_branding"), t("pricing.f.api"), `2% ${t("pricing.fee")}`],
      badge: "bg-cyan-400/20 text-cyan-200",
    },
  ];

  const handleSubscribe = async (tier: "silver" | "gold" | "platinum", mode: "paid" | "trial") => {
    const key = `${tier}-${mode}`;
    setLoading(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.info("Please sign up or log in to subscribe");
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { tier, mode } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      else throw new Error("No checkout URL returned");
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
            "@type": "Offer", name: t.name, price: t.gbp, priceCurrency: "GBP",
            url: "https://booksuite.online/pricing", availability: "https://schema.org/InStock",
          })),
        })}</script>
      </Helmet>
      <Navbar />
      <main>
        <section className="px-8 md:px-16 pt-32 pb-24">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="text-primary">{t("pricing.title1")}</span>{" "}
            <span className="text-foreground">{t("pricing.title2")}</span>
          </h1>
          <p className="text-muted-foreground text-center mb-4 max-w-lg mx-auto">{t("pricing.sub")}</p>
          <p className="text-center text-sm text-primary mb-4">{t("pricing.trial")}</p>
          <p className="text-center text-xs text-muted-foreground mb-12 max-w-xl mx-auto">
            {t("pricing.note", { currency })}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative bg-secondary/60 border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 ${tier.popular ? "ring-1 ring-primary/50" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3">{t("pricing.popular")}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`inline-block mx-auto mb-3 px-4 py-1 rounded-full text-xs font-semibold ${tier.badge}`}>
                    {tier.name}
                  </div>
                  <CardTitle className="text-4xl font-bold text-foreground">
                    {formatPrice(tier.gbp)}
                    <span className="text-sm font-normal text-muted-foreground">{t("pricing.per_month")}</span>
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
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleSubscribe(tier.tier, "paid")}
                    disabled={loading !== null}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                  >
                    {loading === `${tier.tier}-paid` ? t("pricing.loading") : t("pricing.get")}
                  </Button>
                  <Button
                    onClick={() => handleSubscribe(tier.tier, "trial")}
                    disabled={loading !== null}
                    variant="outline"
                    className="w-full rounded-lg border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    {loading === `${tier.tier}-trial` ? t("pricing.loading") : t("pricing.start_trial")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-20">
            <GiftCodeRedeem />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
