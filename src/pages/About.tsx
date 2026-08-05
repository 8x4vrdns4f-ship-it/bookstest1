import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CreditCard, Users, ShieldCheck } from "lucide-react";

const values = [
  {
    icon: CalendarCheck,
    title: "Bookings that just work",
    body: "One link, one embeddable widget, and a calendar your whole team can read at a glance.",
  },
  {
    icon: CreditCard,
    title: "Deposits without the drama",
    body: "Take a card at booking and only charge it when you accept — fewer no-shows, no awkward chasing.",
  },
  {
    icon: Users,
    title: "Built for real teams",
    body: "Roles, shifts, resources and check-in flows designed around how small businesses actually run a day.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "Row-level isolation, Stripe-handled card data, and no selling of customer information. Ever.",
  },
];

const About = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="About BookSuite — Booking Software for Small Businesses"
      description="BookSuite is booking, deposits and team scheduling software built for salons, clinics, restaurants and studios. Learn who we are and what we believe."
      path="/about"
    />
    <Navbar />

    <main className="flex-1 px-6 md:px-16 py-14 max-w-3xl mx-auto text-foreground">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">About BookSuite</h1>
      <p className="text-muted-foreground text-lg leading-relaxed mb-10">
        BookSuite is a booking platform for small businesses that are tired of juggling
        phone calls, DMs and a paper diary. Share one link, let customers book the exact
        slot, table or chair they want, take a deposit if you need one, and run the whole
        day from a single dashboard.
      </p>

      <section className="space-y-6 mb-12">
        <h2 className="text-2xl font-semibold">Why we built it</h2>
        <p className="text-muted-foreground leading-relaxed">
          Most booking tools are either too basic to run a business on, or priced and
          designed for chains with an operations team. Independent salons, barbers,
          clinics, restaurants and studios sit in the middle — they need deposits,
          staff rotas, resources and reminders, without a setup project or a per-seat
          contract. That gap is what BookSuite exists to close.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Everything in the product is judged against one question: does it save the
          owner time on a busy day? If it doesn't, it doesn't ship.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-5 mb-14">
        {values.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-[16px] border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center mb-3">
              <Icon size={18} />
            </div>
            <h3 className="font-semibold mb-1.5">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-semibold mb-3">Company details</h2>
        <div className="rounded-[16px] border border-dashed border-border bg-muted/10 p-5 text-sm text-muted-foreground space-y-1.5">
          <p><strong className="text-foreground">Registered name:</strong> [TO BE ADDED]</p>
          <p><strong className="text-foreground">Registered address:</strong> [TO BE ADDED]</p>
          <p><strong className="text-foreground">Company number:</strong> [TO BE ADDED]</p>
          <p><strong className="text-foreground">ICO registration:</strong> [TO BE ADDED]</p>
          <p><strong className="text-foreground">Support:</strong>{" "}
            <a href="mailto:help@booksuite.online" className="text-primary underline">help@booksuite.online</a>
          </p>
        </div>
      </section>

      <section className="rounded-[16px] border border-border bg-card p-6 text-center">
        <h2 className="text-2xl font-semibold mb-2">Want to see it on your own business?</h2>
        <p className="text-muted-foreground mb-5 text-sm">
          Set up your booking page in a few minutes — no card needed to look around.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/auth?mode=signup">Try BookSuite</Link></Button>
          <Button asChild variant="outline"><Link to="/contact">Talk to us</Link></Button>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default About;
