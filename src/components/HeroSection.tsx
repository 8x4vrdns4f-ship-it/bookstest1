import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="px-6 md:px-12 py-12 md:py-20">
      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {/* Left - Title & Buttons */}
        <div className="flex-1 space-y-8">
          <BrandLogo size="lg" />
          <p className="text-muted-foreground text-lg max-w-md">
            The all-in-one booking management platform for modern businesses.
          </p>
          <div className="flex gap-4">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 py-3 text-base">
              Try now
            </Button>
            <Button variant="outline" className="border-muted-foreground/30 text-foreground hover:bg-secondary font-semibold px-8 py-3 text-base">
              Explore pricing
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
