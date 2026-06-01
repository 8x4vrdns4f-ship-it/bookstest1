import { motion } from "framer-motion";

const cards = [
  { title: "For Businesses", description: "Manage bookings, staff, and customers from one dashboard." },
  { title: "For Staff", description: "View schedules, accept shifts, and stay organized." },
  { title: "For Customers", description: "Book appointments easily, anytime, anywhere." },
];

const InfoCards = () => {
  return (
    <section className="px-6 md:px-12 py-16" aria-labelledby="infocards-heading">
      <h2 id="infocards-heading" className="sr-only">Built for businesses, staff, and customers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-secondary rounded-xl p-8 cursor-pointer transition-colors duration-200 hover:bg-secondary/70 border border-transparent hover:border-primary/30"
          >
            <h3 className="text-xl font-bold text-foreground mb-3">{card.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default InfoCards;
