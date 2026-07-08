import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

type Guide = {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  readTime: string;
  body: JSX.Element;
};

const GUIDES: Guide[] = [
  {
    slug: "online-booking-system-for-small-business",
    title: "How to choose an online booking system for your small business",
    description:
      "A practical guide to picking an online booking system for a small service business — what to look for, what to avoid, and the features that actually matter day-to-day.",
    datePublished: "2026-07-07",
    readTime: "6 min read",
    body: (
      <>
        <p>
          If you run a small service business — a salon, a gym, a mobile trade, a tutoring
          practice — the booking system you pick has an outsized effect on how much time you
          spend on admin versus doing the work. This guide walks through what actually
          matters when you're comparing an online booking system for small business use, and
          the traps to avoid.
        </p>

        <h2>What "good" looks like</h2>
        <p>
          A good booking system does four jobs well: it takes bookings 24/7 without you
          being involved, it collects a deposit so people don't ghost, it reminds customers
          before their appointment, and it gives you a single view of your day. Anything
          beyond that (staff scheduling, gift cards, reviews, analytics) is a bonus — but
          if the core four aren't rock-solid, none of the extras matter.
        </p>

        <h2>Features that pay for themselves</h2>
        <ul>
          <li>
            <strong>Deposits at booking.</strong> The single biggest lever against no-shows.
            A 20% deposit typically cuts them by more than half.
          </li>
          <li>
            <strong>Embeddable booking widget.</strong> If you already have a website, you
            want a snippet of HTML you can paste in — not a redirect to some other domain
            where you lose the customer.
          </li>
          <li>
            <strong>Automated reminders.</strong> A reminder 24 hours before and one 2 hours
            before is the industry standard for a reason.
          </li>
          <li>
            <strong>Staff scheduling.</strong> The moment you have two people taking
            bookings, you need shifts, availability, and per-staff calendars.
          </li>
        </ul>

        <h2>Traps to avoid</h2>
        <p>
          Watch out for booking platforms that own the relationship with your customer —
          the ones that list you in their own marketplace and email your clients under their
          brand. That's fine if you want the marketing lift, but you don't own the
          audience. For a business with its own website and existing customers, you almost
          always want software that sits quietly behind your brand.
        </p>

        <h2>How BookSuite fits</h2>
        <p>
          BookSuite is built specifically for small service businesses: deposits via Stripe,
          an embeddable widget, staff management, automated reminders, and no marketplace
          layer between you and your customers.{" "}
          <Link to="/pricing" className="text-primary underline">
            See pricing
          </Link>{" "}
          or{" "}
          <Link to="/auth?mode=signup" className="text-primary underline">
            start a 30-day free trial
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    slug: "how-to-take-deposits-for-appointments",
    title: "How to take deposits for appointments without losing customers",
    description:
      "Deposits dramatically cut no-shows, but done wrong they scare people off. Here's how to introduce them: the amount, the wording, and the refund policy that keeps first-timers booking.",
    datePublished: "2026-07-07",
    readTime: "5 min read",
    body: (
      <>
        <p>
          Every service business that has ever taken bookings has been burnt by a no-show.
          The customer forgets, gets busy, or just changes their mind — and you've lost a
          slot you could have sold twice over. Deposits fix this. The trick is introducing
          them without scaring off first-time customers.
        </p>

        <h2>How much to charge</h2>
        <p>
          A deposit between <strong>15% and 25%</strong> of the booking price is the sweet
          spot. Small enough that a genuine customer won't hesitate, big enough that a
          time-waster will hesitate. For a £50 appointment, £10 is ideal. For a £200
          appointment, £30–£40.
        </p>

        <h2>What to call it</h2>
        <p>
          Don't call it a "deposit" if you can avoid it — the word triggers hesitation.
          Instead, use "booking fee" or "reservation payment", and make clear it comes off
          the final price. On the booking page: "A £10 booking fee secures your slot and
          comes off your final bill." That framing converts significantly better than
          "deposit required".
        </p>

        <h2>Your refund policy</h2>
        <p>
          Be explicit and generous inside your cancellation window, strict outside it. A
          typical policy: <em>fully refundable if cancelled 24 hours before your
          appointment; non-refundable inside 24 hours</em>. Publish it on the booking page
          so nobody feels tricked.
        </p>

        <h2>Rolling it out to existing customers</h2>
        <p>
          If you have regulars, send a one-off email explaining the change is because
          no-shows have made it hard to keep everyone else's appointments on time. Almost
          nobody objects when it's framed as fairness to other customers.
        </p>

        <h2>Automating it in BookSuite</h2>
        <p>
          BookSuite takes deposits via Stripe at the moment of booking, and refunds them
          automatically when a customer cancels inside your policy window.{" "}
          <Link to="/auth?mode=signup" className="text-primary underline">
            Start a free trial
          </Link>{" "}
          and turn deposits on from Settings.
        </p>
      </>
    ),
  },
  {
    slug: "reduce-no-shows-appointment-reminders",
    title: "The no-show playbook: appointment reminders that actually work",
    description:
      "Automated reminders reduce no-shows dramatically, but the timing and channel matter more than most people realise. Here's the reminder sequence to use.",
    datePublished: "2026-07-07",
    readTime: "4 min read",
    body: (
      <>
        <p>
          Reminders are the second-biggest lever against no-shows, right after deposits. But
          most businesses either send too few (one email the morning of, which people miss)
          or too many (three emails and a text — customers unsubscribe and you lose the
          channel entirely).
        </p>

        <h2>The reminder sequence that works</h2>
        <ol>
          <li>
            <strong>Confirmation, sent immediately.</strong> The moment they book, they get
            a confirmation with the date, time, and a way to reschedule.
          </li>
          <li>
            <strong>24-hour reminder.</strong> Sent the day before. This is the reminder
            that saves the most appointments — it catches people while they can still
            reschedule if something's come up.
          </li>
          <li>
            <strong>2-hour reminder.</strong> Sent the morning of. Purely a memory-jog for
            people whose day has run away with them.
          </li>
        </ol>

        <h2>Channel: email vs SMS</h2>
        <p>
          SMS has higher open rates but is more expensive and easier to opt out of. Email is
          free, universal, and — with a good subject line ("Your appointment tomorrow at 2
          PM") — nearly as effective. Start with email; add SMS only if no-shows are still a
          problem after deposits + email reminders.
        </p>

        <h2>What to put in the reminder</h2>
        <p>
          Keep it short: date, time, service, address, and a single button to reschedule or
          cancel. Don't upsell in a reminder — that's what marketing emails are for.
          Reminders should feel like a favour, not a sales pitch.
        </p>

        <h2>Reminders in BookSuite</h2>
        <p>
          BookSuite sends the confirmation, 24-hour, and 2-hour reminders automatically from
          your own verified sending domain — meaning inbox deliverability stays high.{" "}
          <Link to="/pricing" className="text-primary underline">
            See pricing
          </Link>{" "}
          for the tiers that include automated reminders.
        </p>
      </>
    ),
  },
];

const GuideDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = GUIDES.find((g) => g.slug === slug);

  if (!guide) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title="Guide not found — BookSuite" description="This guide doesn't exist." path={`/guides/${slug}`} noIndex />
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Guide not found</h1>
            <Button asChild><Link to="/">Back to home</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const url = `https://booksuite.online/guides/${guide.slug}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.datePublished,
    author: { "@type": "Organization", name: "BookSuite" },
    publisher: {
      "@type": "Organization",
      name: "BookSuite",
      logo: { "@type": "ImageObject", url: "https://booksuite.online/favicon.png" },
    },
    mainEntityOfPage: url,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://booksuite.online/" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://booksuite.online/guides" },
      { "@type": "ListItem", position: 3, name: guide.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={`${guide.title} — BookSuite`} description={guide.description} path={`/guides/${guide.slug}`} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>
      <Navbar />
      <main className="flex-1 px-6 md:px-16 py-12 max-w-3xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <article>
          <p className="text-xs text-muted-foreground mb-3">{guide.readTime}</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{guide.title}</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{guide.description}</p>
          <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
            {guide.body}
          </div>
        </article>

        <div className="mt-16 p-8 rounded-2xl border border-primary/30 bg-primary/5 text-center">
          <h2 className="text-2xl font-bold mb-3">Try BookSuite free for 30 days</h2>
          <p className="text-muted-foreground mb-6">All the features above, no card required to start.</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/auth?mode=signup">Start free trial</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GuideDetail;
export { GUIDES };
