import { Check, X, Minus } from "lucide-react";
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
  { name: "Monthly Bookings", silver: "Up to 100", gold: "Up to 1,000", platinum: "Unlimited" },
  { name: "Team Members", silver: "1", gold: "Up to 5", platinum: "Unlimited" },
  { name: "Transaction Fee", silver: "12.5%", gold: "7.5%", platinum: "2.5%" },
  { name: "Automated Reminders", silver: "Email", gold: "Email & SMS", platinum: "Email & SMS" },
  { name: "Analytics & Reports", silver: false, gold: true, platinum: "Advanced" },
  { name: "Custom Branding", silver: false, gold: true, platinum: true },
  { name: "Priority Support", silver: "Email", gold: "24h response", platinum: "1h response" },
];

const tiers = [
  { name: "Silver", price: "$199" },
  { name: "Gold", price: "$549" },
  { name: "Platinum", price: "$1,195" },
];

const renderValue = (value: FeatureValue) => {
  if (value === true) return <Check size={18} className="text-primary mx-auto" />;
  if (value === false) return <X size={18} className="text-muted-foreground/40 mx-auto" />;
  return <span className="text-foreground text-xs md:text-sm">{value}</span>;
};

const TierComparison = () => {
  return (
    <section className="px-6 md:px-16 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Compare Plans
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Find the right plan for your business
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-3 md:px-6 text-muted-foreground font-medium text-sm min-w-[140px]">
                Feature
              </th>
              {tiers.map((tier) => (
                <th key={tier.name} className={`py-4 px-3 md:px-6 text-center min-w-[100px] ${tier.name === "Platinum" ? "bg-primary/5" : ""}`}>
                  <span className={`block font-bold text-base md:text-lg ${tier.name === "Platinum" ? "text-primary" : "text-foreground"}`}>{tier.name}</span>
                  <span className={`block text-xs mt-0.5 ${tier.name === "Platinum" ? "text-primary/70" : "text-muted-foreground"}`}>{tier.price}/mo</span>
                </th>
              ))}
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
                <td className="py-3 px-3 md:px-6 text-foreground text-sm font-medium">
                  {feature.name}
                </td>
                <td className="py-3 px-3 md:px-6 text-center">{renderValue(feature.silver)}</td>
                <td className="py-3 px-3 md:px-6 text-center">{renderValue(feature.gold)}</td>
                <td className="py-3 px-3 md:px-6 text-center">{renderValue(feature.platinum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-8">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8" asChild>
          <Link to="/pricing">View Full Pricing</Link>
        </Button>
      </div>
    </section>
  );
};

export default TierComparison;
