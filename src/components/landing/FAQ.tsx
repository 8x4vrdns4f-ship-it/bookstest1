import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How much does BookSuite cost?",
    a: "We offer a free tier to get started and paid tiers as you grow. Check the pricing page for the full breakdown of features per tier.",
  },
  {
    q: "Are there transaction fees on bookings?",
    a: "Lower tiers include a small per-transaction fee on top of Stripe's standard processing fee. Higher tiers reduce or remove the BookSuite fee entirely.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Subscriptions can be cancelled from your dashboard at any time and remain active until the end of your billing period.",
  },
  {
    q: "Who is BookSuite for?",
    a: "Service businesses that take bookings — salons, trainers, studios, clinics, tutors, consultants, mobile services, and more.",
  },
  {
    q: "Can I embed the booking widget on my own website?",
    a: "Yes. Copy one snippet of HTML/JS from your dashboard and paste it into any site. Bookings flow straight back into BookSuite.",
  },
  {
    q: "How do payouts work?",
    a: "Payments go through Stripe Connect. Once you connect your Stripe account, payouts go directly to your bank on Stripe's standard schedule.",
  },
  {
    q: "Do customers actually receive the emails?",
    a: "Yes — transactional emails are sent from your own verified sending domain with proper authentication for strong inbox deliverability.",
  },
  {
    q: "How do I get support?",
    a: "Reach our team at help@booksuite.online — we typically respond within one business day.",
  },
];

const FAQ = () => (
  <section className="px-8 md:px-16 py-20 border-t border-border bg-card/30">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-3">Frequently asked questions</h2>
      <p className="text-muted-foreground mb-10">
        Can't find what you're looking for? Email{" "}
        <a className="text-primary hover:underline" href="mailto:help@booksuite.online">
          help@booksuite.online
        </a>
        .
      </p>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQ;
