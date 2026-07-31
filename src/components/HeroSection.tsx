import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";
import JoinCompanyDialog from "./JoinCompanyDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { Check, Play } from "lucide-react";



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
          <h1 className="sr-only">BookSuite — booking, client, and staff management for service businesses</h1>
          <BrandLogo size="lg" />
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
            {["30-day free trial", "Cancel anytime before it ends", "No setup fees"].map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check size={14} className="text-primary" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 w-full">
          <div className="aspect-video rounded-xl overflow-hidden border border-border bg-secondary shadow-2xl shadow-primary/5 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Play size={22} className="text-primary ml-0.5" />
            </div>
            <p className="text-sm text-muted-foreground">Product walkthrough video coming soon</p>
          </div>
        </div>


      </div>
    </section>
  );
};

export default HeroSection;
