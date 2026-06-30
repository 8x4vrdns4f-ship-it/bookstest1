import { Calendar, Code2, Users, Gift, Mail, CreditCard } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const ExpandedFeatures = () => {
  const { t } = useLocale();
  const features = [
    { Icon: Calendar,   title: t("feat.cal.t"),    body: t("feat.cal.b") },
    { Icon: Code2,      title: t("feat.widget.t"), body: t("feat.widget.b") },
    { Icon: Users,      title: t("feat.staff.t"),  body: t("feat.staff.b") },
    { Icon: Gift,       title: t("feat.gift.t"),   body: t("feat.gift.b") },
    { Icon: Mail,       title: t("feat.email.t"),  body: t("feat.email.b") },
    { Icon: CreditCard, title: t("feat.pay.t"),    body: t("feat.pay.b") },
  ];
  return (
    <section className="px-8 md:px-16 py-20 border-t border-border bg-card/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("feat.title")}</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">{t("feat.sub")}</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-background p-6 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExpandedFeatures;
