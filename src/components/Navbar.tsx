import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/routeAfterAuth";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    <nav className="flex items-center justify-between px-8 md:px-16 py-6">
      <div className="flex items-center gap-3">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <BrandLogo size="sm" />
      </div>
      <a
        href={isLoggedIn ? "/dashboard" : "/auth?mode=login"}
        onClick={isLoggedIn ? handleDashboardClick : undefined}
        className="border border-primary/50 text-primary hover:bg-primary/10 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
      >
        {isLoggedIn ? "Dashboard" : "Login"}
      </a>
    </nav>
  );
};

export default Navbar;
