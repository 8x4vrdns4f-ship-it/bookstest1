import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  ChevronRight,
  Calendar,
  CreditCard,
  UserPlus,
  Users,
  RefreshCcw,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type NotificationKind } from "@/context/NotificationsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  booking_new: Calendar,
  booking_paid: CreditCard,
  booking_refunded: RefreshCcw,
  booking_cancelled: XCircle,
  join_request: UserPlus,
  employee_new: Users,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

const CRUMB_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  calendar: "Calendar",
  clients: "Clients",
  staff: "Staff",
  shifts: "Shifts",
  payments: "Payments",
  settings: "Settings",
};

export default function DashboardHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [initials, setInitials] = useState("BS");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const name = (u.user_metadata?.display_name as string) || u.email || "";
      setEmail(u.email ?? "");
      const parts = name.split(/[\s@.]/).filter(Boolean);
      setInitials(((parts[0]?.[0] ?? "B") + (parts[1]?.[0] ?? "S")).toUpperCase());
    });
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((s) => CRUMB_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="h-16 shrink-0 border-b border-border bg-background/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="h-5 w-px bg-border" />
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((label, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
              <span
                className={
                  i === crumbs.length - 1
                    ? "text-foreground font-medium truncate"
                    : "text-muted-foreground truncate"
                }
              >
                {label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 w-9 h-9 rounded-full bg-secondary border border-border grid place-items-center text-xs font-semibold text-foreground hover:border-primary/60 transition-colors"
              aria-label="Account menu"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground truncate">{email || "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/payments">Payments</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
