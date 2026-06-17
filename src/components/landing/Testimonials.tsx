const quotes = [
  {
    quote:
      "BookSuite replaced three tools we were stitching together. My team can finally see the whole week at a glance.",
    name: "Sarah M.",
    role: "Salon owner",
  },
  {
    quote:
      "The embeddable widget took five minutes to install. Bookings doubled in the first month.",
    name: "James T.",
    role: "Personal trainer",
  },
  {
    quote:
      "Automatic reminders cut our no-shows in half. The shift planner is genuinely the cleanest I've used.",
    name: "Priya K.",
    role: "Studio manager",
  },
];

const Testimonials = () => (
  <section className="px-8 md:px-16 py-20 border-t border-border">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-3">Loved by service businesses</h2>
      <p className="text-muted-foreground mb-12 max-w-2xl">
        From solo operators to multi-staff studios.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {quotes.map((q) => (
          <figure
            key={q.name}
            className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between"
          >
            <blockquote className="text-foreground/90 leading-relaxed mb-6">
              "{q.quote}"
            </blockquote>
            <figcaption>
              <div className="font-semibold text-sm">{q.name}</div>
              <div className="text-muted-foreground text-xs">{q.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
