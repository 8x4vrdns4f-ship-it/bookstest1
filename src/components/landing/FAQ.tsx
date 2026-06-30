import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocale } from "@/contexts/LocaleContext";

const FAQ = () => {
  const { t } = useLocale();
  const faqs = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ q: t(`faq.q${i}`), a: t(`faq.a${i}`) }));
  return (
    <section className="px-8 md:px-16 py-20 border-t border-border bg-card/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("faq.title")}</h2>
        <p className="text-muted-foreground mb-10">
          {t("faq.sub")}{" "}
          <a className="text-primary hover:underline" href="mailto:help@booksuite.online">help@booksuite.online</a>.
        </p>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
