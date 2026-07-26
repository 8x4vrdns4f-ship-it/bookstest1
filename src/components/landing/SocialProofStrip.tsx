import { Users, CreditCard, Globe, Zap } from "lucide-react";

const items = [
  { Icon: Users, label: "Built for every service business" },
  { Icon: CreditCard, label: "Instant deposits via Stripe" },
  { Icon: Globe, label: "38 languages, auto currency" },
  { Icon: Zap, label: "Live in under 5 minutes" },
];

const SocialProofStrip = () => (
  <section className="px-6 md:px-16 py-6 border-y border-border bg-card/40">
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-2.5 text-xs md:text-sm text-muted-foreground">
          <Icon size={16} className="text-primary shrink-0" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  </section>
);

export default SocialProofStrip;
