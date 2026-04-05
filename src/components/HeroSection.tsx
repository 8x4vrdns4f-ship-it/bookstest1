import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="px-8 md:px-16 pt-20 md:pt-32 pb-16 md:pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-16">
        {/* Left - Title & Buttons */}
        <div className="flex-1 space-y-6">
          <BrandLogo size="lg" />
          <p className="text-muted-foreground text-base md:text-lg max-w-md">
            Bookings, Clients, and Staff schedules, all in one place
          </p>
          <div className="flex gap-4 pt-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-2.5 text-sm rounded-lg">
              Try now
            </Button>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 font-semibold px-6 py-2.5 text-sm rounded-lg">
              Explore Pricing
            </Button>
          </div>
        </div>

        {/* Right - Video Placeholder */}
        <div className="flex-1 w-full">
          <div className="aspect-video rounded-xl bg-secondary border border-border flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Video coming soon</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
