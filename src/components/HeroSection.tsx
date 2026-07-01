import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";
import JoinCompanyDialog from "./JoinCompanyDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { Check } from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const HeroSection = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useLocale();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="px-8 md:px-16 pt-20 md:pt-32 pb-16 md:pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-16">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
            Bookings, clients & staff — <span className="text-primary">one dashboard.</span>
          </h1>
          <div className="pt-1"><BrandLogo size="sm" /></div>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">
            {t("hero.tagline")}
          </p>
          <div className="flex gap-3 pt-2 flex-wrap">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-2.5 text-sm rounded-lg" asChild>
              <Link to="/auth?mode=signup">{t("hero.try")}</Link>
            </Button>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 font-semibold px-6 py-2.5 text-sm rounded-lg" asChild>
              <Link to="/pricing">{t("hero.pricing")}</Link>
            </Button>
            <JoinCompanyDialog />
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground pt-2">
            {["Free 14-day trial", "No credit card required", "Cancel anytime"].map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check size={14} className="text-primary" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 w-full">
          <div className="relative rounded-xl border border-border overflow-hidden shadow-2xl shadow-primary/10">
            <img
              src={heroDashboard}
              alt="BookSuite dashboard preview showing calendar, bookings and stats"
              width={1280}
              height={832}
              className="w-full h-auto block"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/10 rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
