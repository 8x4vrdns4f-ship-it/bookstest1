import { BadgePercent, FileX, Users } from "lucide-react";

const POINTS = [
  { icon: BadgePercent, title: "No marketplace commission", text: "BookSuite doesn't take a cut of your clients. Just 30p a booking paid online — never more than £25 a month, plus Stripe card fees. Platinum has no booking fees." },
  { icon: FileX, title: "No contract", text: "Pay monthly or yearly and cancel from your dashboard whenever you like." },
  { icon: Users, title: "Your clients stay yours", text: "Clients book with your business, not a marketplace. Their details belong to you." },
];

const CompetitorComparison = () => (
  <section className="px-6 md:px-16 py-16 md:py-20">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">How BookSuite compares</h2>
        <p className="text-muted-foreground text-sm md:text-base">
          No contract. Your clients stay yours. 30 days free (card required, cancel before it ends).
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
            <span className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center mb-3">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-foreground mb-1.5">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CompetitorComparison;
