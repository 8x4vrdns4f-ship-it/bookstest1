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
import { useIsAdmin } from "@/hooks/useIsAdmin";

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
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();

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
    <header className="h-14 shrink-0 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold">Notifications</div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground px-6">
                You're all caught up. New bookings, payments, and team activity will appear here in real time.
              </div>
            ) : (
              <ScrollArea className="max-h-[420px]">
                <ul className="divide-y divide-border">
                  {notifications.map((n) => {
                    const Icon = KIND_ICON[n.kind] ?? Bell;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => {
                            markRead(n.id);
                            if (n.href) navigate(n.href);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors flex gap-3 ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="mt-0.5 h-8 w-8 rounded-full bg-secondary grid place-items-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium text-foreground truncate">{n.title}</div>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                            </div>
                            {n.body && (
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>
                            )}
                            <div className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </PopoverContent>
        </Popover>
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
            {adminState === "admin" && (
              <DropdownMenuItem asChild>
                <Link to="/admin">Admin panel</Link>
              </DropdownMenuItem>
            )}
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
