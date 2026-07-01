import { useLocale } from "@/contexts/LocaleContext";

const Testimonials = () => {
  const { t } = useLocale();
  const quotes = [
    { quote: t("test.1.q"), name: "Sarah M.",  role: t("test.1.r") },
    { quote: t("test.2.q"), name: "James T.",  role: t("test.2.r") },
    { quote: t("test.3.q"), name: "Priya K.",  role: t("test.3.r") },
  ];
  return (
    <section className="px-8 md:px-16 py-20 border-t border-border bg-card/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("test.title")}</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">{t("test.sub")}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <figure key={q.name} className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
              <blockquote className="text-foreground/90 leading-relaxed mb-6">"{q.quote}"</blockquote>
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
};

export default Testimonials;
