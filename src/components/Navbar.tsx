import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "./BrandLogo";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

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
      <a href="/auth" className="text-primary font-semibold text-sm hover:text-primary/80 transition-colors">
        Login
      </a>
    </nav>
  );
};

export default Navbar;
