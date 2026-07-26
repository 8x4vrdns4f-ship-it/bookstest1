import { Users, CreditCard, Globe, Zap, Scissors, Dumbbell, Stethoscope, UtensilsCrossed, GraduationCap, Wrench, Truck } from "lucide-react";

const metrics = [
  { Icon: Users, label: "Built for every service business" },
  { Icon: CreditCard, label: "Instant deposits via Stripe" },
  { Icon: Globe, label: "38 languages, auto currency" },
  { Icon: Zap, label: "Live in under 5 minutes" },
];

const industries = [
  { Icon: Scissors, label: "Salons" },
  { Icon: Dumbbell, label: "Gyms" },
  { Icon: Stethoscope, label: "Clinics" },
  { Icon: UtensilsCrossed, label: "Restaurants" },
  { Icon: GraduationCap, label: "Tutors" },
  { Icon: Wrench, label: "Trades" },
  { Icon: Truck, label: "Mobile services" },
];

const SocialProofStrip = () => (
  <section className="px-6 md:px-16 py-8 border-y border-border bg-card/40">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs md:text-sm text-muted-foreground">
            <Icon size={16} className="text-primary shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-border/60">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mr-2">Trusted across</span>
        {industries.map(({ Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1"
          >
            <Icon size={12} className="text-primary" />
            {label}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofStrip;
