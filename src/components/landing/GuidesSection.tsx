import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const GUIDES = [
  {
    slug: "online-booking-system-for-small-business",
    title: "How to choose an online booking system for your small business",
    excerpt: "A plain-English walkthrough of what matters when you pick booking software — deposits, no-shows, staff scheduling, and embedding the widget on your own site.",
    readTime: "6 min read",
  },
  {
    slug: "how-to-take-deposits-for-appointments",
    title: "How to take deposits for appointments (without losing customers)",
    excerpt: "Deposits cut no-shows by up to 70%. Here's how to introduce them without scaring off first-time clients — the amount, the wording, and the refund policy that works.",
    readTime: "5 min read",
  },
  {
    slug: "reduce-no-shows-appointment-reminders",
    title: "The no-show playbook: reminders that actually work",
    excerpt: "Automated reminders reduce no-shows dramatically, but the timing and channel matter. Here's the sequence we recommend for service businesses running BookSuite.",
    readTime: "4 min read",
  },
];

const GuidesSection = () => {
  return (
    <section className="px-8 md:px-16 py-20 border-t border-border" aria-labelledby="guides-heading">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-primary text-sm font-semibold mb-2 uppercase tracking-wide">Resources</p>
          <h2 id="guides-heading" className="text-3xl md:text-4xl font-bold mb-3">
            Guides for growing a booking-based business
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Short, practical guides on running a service business — from taking deposits to
            cutting no-shows to embedding a booking widget on your own site.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              to={`/guides/${g.slug}`}
              className="group block rounded-xl border border-border bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all p-6"
            >
              <p className="text-xs text-muted-foreground mb-3">{g.readTime}</p>
              <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                {g.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{g.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                Read guide <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GuidesSection;
