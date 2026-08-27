import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type FeatureValue = boolean | string;

interface Feature {
  name: string;
  silver: FeatureValue;
  gold: FeatureValue;
  platinum: FeatureValue;
}

const features: Feature[] = [
  { name: "Monthly Bookings", silver: "Up to 100", gold: "Up to 500", platinum: "Unlimited" },
  { name: "Team Members", silver: "2", gold: "Up to 10", platinum: "Unlimited" },
  { name: "Services", silver: "Up to 5", gold: "Unlimited", platinum: "Unlimited" },
  { name: "Bookable Resources", silver: false, gold: "Up to 10", platinum: "Unlimited" },
  { name: "Transaction Fee", silver: "12.5%", gold: "5%", platinum: "2%" },
  { name: "Automated Reminders", silver: "Email", gold: "Email & SMS", platinum: "Email & SMS" },
  { name: "Reviews & Ratings", silver: false, gold: true, platinum: true },
  { name: "Waitlist", silver: false, gold: true, platinum: true },
  { name: "Day & Rental Bookings", silver: false, gold: true, platinum: true },
  { name: "Analytics & Reports", silver: false, gold: true, platinum: "Advanced" },
  { name: "Custom Branding", silver: false, gold: true, platinum: true },
  { name: "CSV Export", silver: false, gold: false, platinum: true },
  { name: "Gift Codes", silver: false, gold: false, platinum: true },
  { name: "API Access", silver: false, gold: false, platinum: true },
  { name: "Remove BookSuite Badge", silver: false, gold: false, platinum: true },
  { name: "Data History", silver: "6 months", gold: "2 years", platinum: "Unlimited" },
  { name: "Priority Support", silver: "Email", gold: "24h response", platinum: "1h response" },
];


// Monthly prices in GBP; annual = monthly * 12 * 0.8 (20% off).
const tiers = [
  { key: "silver",   name: "Silver",   monthly: 20,  popular: false },
  { key: "gold",     name: "Gold",     monthly: 59,  popular: true  },
  { key: "platinum", name: "Platinum", monthly: 199, popular: false },
];

const fmt = (n: number) => `£${Math.round(n).toLocaleString()}`;

const renderValue = (value: FeatureValue) => {
  if (value === true) return <Check size={18} className="text-primary mx-auto" />;
  if (value === false) return <X size={18} className="text-muted-foreground/40 mx-auto" />;
  return <span className="text-foreground text-xs md:text-sm">{value}</span>;
};

const TierComparison = () => {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const priceFor = (monthly: number) =>
    billing === "monthly"
      ? { primary: `${fmt(monthly)}/mo`, sub: "billed monthly" }
      : { primary: `${fmt(monthly * 0.8)}/mo`, sub: `${fmt(monthly * 12 * 0.8)} billed yearly` };

  return (
    <section className="px-6 md:px-16 py-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Compare Plans</h2>
        <p className="text-muted-foreground text-sm md:text-base">Find the right plan for your business</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-card/60">
          <button
            onClick={() => setBilling("monthly")}
            className={`text-xs md:text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`text-xs md:text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              billing === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              billing === "annual" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
            }`}>Save 20%</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-3 md:px-6 text-muted-foreground font-medium text-sm min-w-[140px]">
                Feature
              </th>
              {tiers.map((tier) => {
                const p = priceFor(tier.monthly);
                return (
                  <th
                    key={tier.name}
                    className={`relative py-4 px-3 md:px-6 text-center min-w-[110px] ${tier.popular ? "bg-primary/10" : ""}`}
                  >
                    {tier.popular && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                        <Sparkles size={10} /> Most popular
                      </span>
                    )}
                    <span className={`block font-bold text-base md:text-lg ${tier.popular ? "text-primary" : "text-foreground"}`}>
                      {tier.name}
                    </span>
                    <span className={`block text-xs mt-0.5 ${tier.popular ? "text-primary/70" : "text-muted-foreground"}`}>
                      {p.primary}
                    </span>
                    <span className="block text-[10px] mt-0.5 text-muted-foreground/70">{p.sub}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, i) => (
              <tr
                key={feature.name}
                className={`border-b border-border/50 transition-colors hover:bg-secondary/50 ${
                  i % 2 === 0 ? "bg-transparent" : "bg-secondary/20"
                }`}
              >
                <td className="py-3 px-3 md:px-6 text-foreground text-sm font-medium">{feature.name}</td>
                <td className="py-3 px-3 md:px-6 text-center">{renderValue(feature.silver)}</td>
                <td className="py-3 px-3 md:px-6 text-center bg-primary/10">
                  {typeof feature.gold === "boolean"
                    ? renderValue(feature.gold)
                    : <span className="text-primary text-xs md:text-sm font-medium">{feature.gold}</span>}
                </td>
                <td className="py-3 px-3 md:px-6 text-center">{renderValue(feature.platinum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8" asChild>
          <Link to="/auth?mode=signup">Start free</Link>
        </Button>
        <Button variant="outline" className="font-semibold px-8" asChild>
          <Link to="/pricing">View full pricing</Link>
        </Button>
      </div>
    </section>
  );
};

export default TierComparison;

