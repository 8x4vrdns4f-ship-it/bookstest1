const steps = [
  {
    n: "01",
    title: "Sign up — it's free",
    body: "Create your BookSuite account in under a minute. No card needed to explore.",
  },
  {
    n: "02",
    title: "Set up services, staff & hours",
    body: "Add your services, working hours, and any team members. Owners can plan shifts weeks in advance.",
  },
  {
    n: "03",
    title: "Share your link or embed the widget",
    body: "Send clients your booking page, or drop the embeddable widget straight onto your own website.",
  },
  {
    n: "04",
    title: "Get paid — we handle the rest",
    body: "Stripe-powered payments and deposits, plus automatic confirmations, reminders, and receipts.",
  },
];

const HowItWorks = () => (
  <section className="px-8 md:px-16 py-20 border-t border-border">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-3">How it works</h2>
      <p className="text-muted-foreground mb-12 max-w-2xl">
        Four steps from signup to taking your first booking.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
          >
            <div className="text-primary font-bold text-sm mb-3">{s.n}</div>
            <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
