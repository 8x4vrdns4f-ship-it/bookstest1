import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";
import JoinCompanyDialog from "./JoinCompanyDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";

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
        </div>

        <div className="flex-1 w-full">
          <div className="aspect-video rounded-xl bg-secondary border border-border flex items-center justify-center">
            <span className="text-muted-foreground text-sm">{t("hero.video")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
