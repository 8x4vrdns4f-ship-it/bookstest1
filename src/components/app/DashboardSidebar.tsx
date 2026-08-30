import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  Users,
  UsersRound,
  Clock,
  Star,
  BarChart3,
  Megaphone,

  CreditCard,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import BrandLogo from "@/components/BrandLogo";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

const mainItems: NavItem[] = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Bookings", url: "/dashboard/bookings", icon: CalendarDays },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  { title: "Staff", url: "/dashboard/staff", icon: UsersRound },
  { title: "Shifts", url: "/dashboard/shifts", icon: Clock },
  { title: "Reviews", url: "/dashboard/reviews", icon: Star },
  { title: "Insights", url: "/dashboard/insights", icon: BarChart3 },
  { title: "Marketing", url: "/dashboard/campaigns", icon: Megaphone },

];

const accountItems: NavItem[] = [
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export default function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const renderItem = (item: NavItem) => {
    const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.title}
          className="h-9 rounded-lg data-[active=true]:bg-primary/[0.12] data-[active=true]:text-primary data-[active=true]:font-semibold hover:bg-sidebar-accent/70 transition-colors"
        >
          <NavLink to={item.url} end={item.end}>
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="tracking-[-0.01em]">{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 px-4 border-b border-sidebar-border flex flex-row items-center">
        <div className="flex items-center gap-2 px-1">
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
              BS
            </div>
          ) : (
            <BrandLogo size="sm" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-2">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-2">
              Account
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>{accountItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-[10px] text-muted-foreground/70 px-2">
            BookSuite · v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
