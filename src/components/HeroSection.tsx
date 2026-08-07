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
        <div className="flex-1 space-y-5">
          <BrandLogo size="md" />
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight max-w-xl">
            {t("hero.headline")}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">
            {t("hero.tagline")}
          </p>
          <div className="flex gap-3 pt-1 flex-wrap items-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-7 py-3 text-base rounded-lg" asChild>
              <Link to="/auth?mode=signup">{t("hero.try")}</Link>
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-muted font-medium px-6 py-3 text-sm rounded-lg" asChild>
              <Link to="/pricing">{t("hero.pricing")}</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("hero.support")}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/80 pt-2 max-w-xl">
            {[t("hero.trust.1"), t("hero.trust.2"), t("hero.trust.3"), t("hero.trust.4")].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <Check size={16} className="text-primary shrink-0 mt-0.5" />
                {x}
              </li>
            ))}
          </ul>
          <div className="pt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{t("hero.join")}</span>
            <JoinCompanyDialog />
          </div>
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
