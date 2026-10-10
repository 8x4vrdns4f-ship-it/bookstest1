import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Handshake, Store, MessageSquareQuote } from "lucide-react";

/**
 * Honest "founding partner" block — replaces placeholder quotes until real
 * reviews exist. Add real partner quotes to PARTNERS when you have them.
 */
type Partner = { quote: string; name: string; business: string; town: string };
const PARTNERS: Partner[] = [];

const PERKS = [
  { icon: Handshake, title: "Half-price booking fees", text: "Founding partners pay half the booking fee for their first 30 days." },
  { icon: Store, title: "Your shop featured here", text: "Your business name, town and photo shown to every visitor." },
  { icon: MessageSquareQuote, title: "A say in what we build", text: "Direct line to the team — your requests jump the queue." },
];

const Testimonials = () => (
  <section className="px-8 md:px-16 py-20 border-t border-border bg-card/30">
    <div className="max-w-6xl mx-auto">
      <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">Founding partners</span>
      <h2 className="text-3xl md:text-4xl font-bold mb-3">
        {PARTNERS.length ? "Our founding partners" : "Become one of our founding partners"}
      </h2>
      <p className="text-muted-foreground mb-12 max-w-2xl">
        We're a new, independent UK booking platform. We're looking for our first shops to grow with us — and we'll make it worth your while.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {PARTNERS.length
          ? PARTNERS.map((p) => (
              <figure key={p.name} className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
                <blockquote className="text-foreground/90 leading-relaxed mb-6">"{p.quote}"</blockquote>
                <figcaption>
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-muted-foreground text-xs">{p.business}, {p.town}</div>
                </figcaption>
              </figure>
            ))
          : PERKS.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-card p-6">
                <span className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center mb-4"><p.icon className="h-5 w-5" /></span>
                <div className="font-semibold text-foreground mb-1.5">{p.title}</div>
                <p className="text-sm text-muted-foreground">{p.text}</p>
              </div>
            ))}
      </div>
      <div className="mt-8"><Button asChild><Link to="/auth?mode=signup">Claim a founding spot</Link></Button></div>
    </div>
  </section>
);

export default Testimonials;
