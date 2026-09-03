import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

const tabs = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/businesses", label: "Businesses" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/inbox", label: "Inbox" },
  { to: "/admin/gift-codes", label: "Gift codes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <BrandLogo size="sm" />
          <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground hidden sm:inline">
            Admin
          </span>
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 w-full">{children}</main>
    </div>
  );
}
