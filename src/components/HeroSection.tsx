import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";
import JoinCompanyDialog from "./JoinCompanyDialog";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="px-8 md:px-16 pt-20 md:pt-32 pb-16 md:pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-16">
        {/* Left - Title & Buttons */}
        <div className="flex-1 space-y-6">
          <h1 className="sr-only">BookSuite — booking, client, and staff management for service businesses</h1>
          <BrandLogo size="lg" />
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">
            BookSuite is the all-in-one platform for service businesses — take bookings and deposits,
            manage staff shifts, send automatic confirmations and reminders, and get paid through Stripe.
            Embed a booking widget on any site in minutes.
          </p>
          <div className="flex gap-3 pt-2 flex-wrap">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-2.5 text-sm rounded-lg" asChild>
              <Link to="/auth?mode=signup">Try now</Link>
            </Button>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 font-semibold px-6 py-2.5 text-sm rounded-lg" asChild>
              <Link to="/pricing">Explore Pricing</Link>
            </Button>
            <JoinCompanyDialog />
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
