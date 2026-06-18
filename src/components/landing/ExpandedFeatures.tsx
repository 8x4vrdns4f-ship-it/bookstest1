import { Calendar, Code2, Users, Gift, Mail, CreditCard } from "lucide-react";

const features = [
  {
    Icon: Calendar,
    title: "Smart calendar & 30-min slots",
    body: "A clear day, week, and month view. Tap any day to drop into 30-minute slots and see exactly who's booked when.",
  },
  {
    Icon: Code2,
    title: "Embeddable booking widget",
    body: "Copy one snippet and your booking flow lives on any website — bookings sync straight back to your dashboard in real time.",
  },
  {
    Icon: Users,
    title: "Staff management & shifts",
    body: "Add employees, plan their shifts weeks ahead, and see who's on shift right now. Each staff member gets their own dashboard.",
  },
  {
    Icon: Gift,
    title: "Gift codes & subscriptions",
    body: "Coming soon.",
  },
  {
    Icon: Mail,
    title: "Automatic transactional emails",
    body: "Booking confirmations, reminders, payment receipts, refund notices, and staff invites — all sent automatically from BookSuite on your behalf.",
  },
  {
    Icon: CreditCard,
    title: "Stripe-powered payments",
    body: "Take deposits or full payment at booking with Stripe Connect. Refunds, payouts, and reporting handled for you.",
  },
];

const ExpandedFeatures = () => (
  <section className="px-8 md:px-16 py-20 border-t border-border bg-card/30">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything your booking business needs</h2>
      <p className="text-muted-foreground mb-12 max-w-2xl">
        One platform replaces your calendar app, payment processor, email tool, and staff scheduler.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-background p-6 hover:border-primary/40 transition-colors"
          >
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

export default ExpandedFeatures;
