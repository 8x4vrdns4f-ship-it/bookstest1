import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import InfoCards from "@/components/InfoCards";
import FeaturesStrip from "@/components/FeaturesStrip";
import TierComparison from "@/components/TierComparison";
import HowItWorks from "@/components/landing/HowItWorks";
import ExpandedFeatures from "@/components/landing/ExpandedFeatures";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="BookSuite — Manage Bookings, Clients, and Staff"
        description="All-in-one booking platform for small service businesses. Take appointments, deposits, and manage clients and staff from one dashboard."
        path="/"
      />
      <Navbar />
      <main>
        <HeroSection />
        <InfoCards />
        <HowItWorks />
        <FeaturesStrip />
        <ExpandedFeatures />
        <TierComparison />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
