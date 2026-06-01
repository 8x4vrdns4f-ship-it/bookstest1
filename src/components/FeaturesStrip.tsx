const features = [
  { emoji: "📅", label: "Booking" },
  { emoji: "👥", label: "Teams" },
  { emoji: "💳", label: "Payments" },
  { emoji: "📊", label: "Analytics" },
  { emoji: "🔔", label: "Reminders" },
];

const FeaturesStrip = () => {
  return (
    <section className="px-6 md:px-12 py-16" aria-labelledby="features-heading">
      <h2 id="features-heading" className="sr-only">Everything you need to run bookings</h2>
      <div className="flex items-center justify-center flex-wrap gap-2 md:gap-0">
        {features.map((feature, i) => (
          <div key={feature.label} className="flex items-center">
            <div className="flex flex-col items-center px-6 md:px-10">
              <span className="text-3xl md:text-4xl mb-2" aria-hidden="true">{feature.emoji}</span>
              <span className="text-foreground font-semibold text-sm md:text-base">{feature.label}</span>
            </div>
            {i < features.length - 1 && (
              <span className="text-muted-foreground text-2xl font-light hidden md:block" aria-hidden="true">—</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesStrip;
