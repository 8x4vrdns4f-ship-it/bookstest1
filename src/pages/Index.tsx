import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofStrip from "@/components/landing/SocialProofStrip";
import InfoCards from "@/components/InfoCards";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import Footer from "@/components/Footer";

// Below-the-fold: lazy-load to shrink the initial JS payload for better LCP/TTI.
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const FeaturesStrip = lazy(() => import("@/components/FeaturesStrip"));
const ExpandedFeatures = lazy(() => import("@/components/landing/ExpandedFeatures"));
const TierComparison = lazy(() => import("@/components/TierComparison"));
const IndustrySections = lazy(() => import("@/components/landing/IndustrySections"));
const CompetitorComparison = lazy(() => import("@/components/landing/CompetitorComparison"));
const Testimonials = lazy(() => import("@/components/landing/Testimonials"));
const GuidesSection = lazy(() => import("@/components/landing/GuidesSection"));
const FAQ = lazy(() => import("@/components/landing/FAQ"));
const FinalCTA = lazy(() => import("@/components/landing/FinalCTA"));

const Fallback = () => <div className="h-40" aria-hidden />;


const FAQS: { q: string; a: string }[] = [
  { q: "How much does BookSuite cost?", a: "We offer a free tier to get started and paid tiers as you grow. Check the pricing page for the full breakdown of features per tier." },
  { q: "Are there transaction fees on bookings?", a: "Lower tiers include a small per-transaction fee on top of Stripe's standard processing fee. Higher tiers reduce or remove the BookSuite fee entirely." },
  { q: "Can I cancel any time?", a: "Yes. Subscriptions can be cancelled from your dashboard at any time and remain active until the end of your billing period." },
  { q: "Who is BookSuite for?", a: "Service businesses that take bookings — beauty, fitness, health, trades, tutors, consultants, mobile services, and more." },
  { q: "Can I embed the booking widget on my own website?", a: "Yes. Copy one snippet of HTML/JS from your dashboard and paste it into any site. Bookings flow straight back into BookSuite." },
  { q: "How do payouts work?", a: "Payments go through Stripe Connect. Once you connect your Stripe account, payouts go directly to your bank on Stripe's standard schedule." },
  { q: "Do customers actually receive the emails?", a: "Yes — transactional emails are sent from your own verified sending domain with proper authentication for strong inbox deliverability." },
  { q: "How do I get support?", a: "Reach our team at help@booksuite.online — we typically respond within one business day." },
];

const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BookSuite",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://booksuite.online/",
  description: "All-in-one booking, scheduling, and client management platform for small service businesses.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "GBP",
    lowPrice: "1.99",
    highPrice: "11.95",
    offerCount: 3,
    url: "https://booksuite.online/pricing",
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="BookSuite — Booking Software for Small Service Businesses"
        description="All-in-one booking software for small service businesses. Take appointments and deposits, manage clients and staff, and embed a booking widget on your site."
        path="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareApplicationLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofStrip />
        <InfoCards />
        <Suspense fallback={<Fallback />}>
          <ProductShowcase />
          <HowItWorks />
          <FeaturesStrip />
          <ExpandedFeatures />
          <TierComparison />
          <IndustrySections />
          <CompetitorComparison />
          <Testimonials />
          <GuidesSection />
          <FAQ />
          <FinalCTA />
        </Suspense>
      </main>
      <StickyMobileCTA />
      <Footer />
    </div>
  );
};

export default Index;
