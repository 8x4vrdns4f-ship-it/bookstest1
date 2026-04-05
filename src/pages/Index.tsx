import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import InfoCards from "@/components/InfoCards";
import FeaturesStrip from "@/components/FeaturesStrip";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <InfoCards />
      <FeaturesStrip />
    </div>
  );
};

export default Index;
