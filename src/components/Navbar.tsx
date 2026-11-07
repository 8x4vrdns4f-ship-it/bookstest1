import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "./BrandLogo";
import LanguageSwitcher from "./LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/routeAfterAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const handleDashboardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate("/auth?mode=login");
      return;
    }
    const route = await getDashboardRoute();
    navigate(route);
  };

  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 md:px-16 py-6">
      <div className="flex items-center gap-2 sm:gap-3">
        {!isHome && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate("/")}
            className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <BrandLogo size="sm" />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
        <Link to="/guides" className="hidden sm:inline text-sm text-muted-foreground hover:text-primary transition-colors">Guides</Link>
        <LanguageSwitcher />
        <a
          href={isLoggedIn ? "/dashboard" : "/auth?mode=login"}
          onClick={isLoggedIn ? handleDashboardClick : undefined}
          className="border border-primary/50 text-primary hover:bg-primary/10 font-semibold text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors"
        >
          {isLoggedIn ? t("nav.dashboard") : t("nav.login")}
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
