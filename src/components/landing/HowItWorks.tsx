import { useLocale } from "@/contexts/LocaleContext";

const HowItWorks = () => {
  const { t } = useLocale();
  const steps = [
    { n: "01", t: t("how.1.t"), b: t("how.1.b") },
    { n: "02", t: t("how.2.t"), b: t("how.2.b") },
    { n: "03", t: t("how.3.t"), b: t("how.3.b") },
    { n: "04", t: t("how.4.t"), b: t("how.4.b") },
  ];
  return (
    <section className="px-8 md:px-16 py-20 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("how.title")}</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">{t("how.sub")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
              <div className="text-primary font-bold text-sm mb-3">{s.n}</div>
              <h3 className="font-semibold text-lg mb-2">{s.t}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
