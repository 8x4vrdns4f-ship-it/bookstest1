import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";
import JoinCompanyDialog from "./JoinCompanyDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { Check, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import loopVideo from "@/assets/booksuite-homepage-loop-web.mp4.asset.json";
import loopPoster from "@/assets/booksuite-homepage-loop-poster.jpg.asset.json";
import filmVideo from "@/assets/booksuite-homepage-film-v4.mp4.asset.json";
import filmPoster from "@/assets/booksuite-homepage-film-v4-poster.jpg.asset.json";



const HeroSection = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const { t } = useLocale();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section className="px-8 md:px-16 pt-20 md:pt-32 pb-16 md:pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-16">
        <div className="flex-1 space-y-5">
          <BrandLogo size="sm" />
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
          <button
            type="button"
            onClick={() => setFilmOpen(true)}
            aria-label="Watch the BookSuite film, 30 seconds"
            className="relative block w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <video
              key={reduceMotion ? "still" : "loop"}
              className="aspect-video w-full rounded-xl overflow-hidden border border-border bg-secondary shadow-2xl shadow-primary/5"
              src={loopVideo.url}
              poster={loopPoster.url}
              autoPlay={!reduceMotion}
              muted
              loop
              playsInline
              preload="auto"
              aria-label="BookSuite in 10 seconds: a client requests a time, you accept, the deposit is charged and the client is emailed"
            />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-sm font-semibold text-foreground">
              <Play size={14} className="fill-current" />
              Watch the film · 30s
            </span>
          </button>
          <Dialog open={filmOpen} onOpenChange={setFilmOpen}>
            <DialogContent className="max-w-5xl p-2 sm:p-4">
              <DialogTitle className="sr-only">BookSuite film</DialogTitle>
              {filmOpen && (
                <video
                  className="w-full aspect-video rounded-lg"
                  src={filmVideo.url}
                  poster={filmPoster.url}
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
    </section>
  );
};

export default HeroSection;
