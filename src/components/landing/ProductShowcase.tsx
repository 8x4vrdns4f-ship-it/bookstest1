import { useState } from "react";
import { LayoutDashboard, Calendar, Smartphone } from "lucide-react";
import dashboardShot from "@/assets/shot-dashboard.jpg";
import calendarShot from "@/assets/shot-calendar.jpg";
import widgetShot from "@/assets/shot-widget.jpg";

type Tab = "dashboard" | "calendar" | "widget";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard; caption: string; img: string; w: number; h: number }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    caption: "Every booking, client, payment, and team member in one place — with the numbers that actually matter surfaced up top.",
    img: dashboardShot,
    w: 1600,
    h: 1008,
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    caption: "Drag, drop, and colour-code by staff. See your whole week at a glance and stop double-booking forever.",
    img: calendarShot,
    w: 1600,
    h: 1008,
  },
  {
    id: "widget",
    label: "Booking widget",
    icon: Smartphone,
    caption: "One snippet of code and your customers can book on your site 24/7 — with deposits, party size, and resource picking built in.",
    img: widgetShot,
    w: 912,
    h: 1200,
  },
];

const BrowserFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl overflow-hidden border border-border bg-card/60 shadow-2xl">
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-card/80">
      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
      <span className="ml-4 text-[11px] text-muted-foreground tracking-wide">app.booksuite.online</span>
    </div>
    {children}
  </div>
);

const ProductShowcase = () => {
  const [active, setActive] = useState<Tab>("dashboard");
  const current = TABS.find(t => t.id === active)!;

  return (
    <section className="px-6 md:px-16 py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">See BookSuite in action</h2>
          <p className="text-muted-foreground text-sm md:text-base">The dashboard, calendar, and booking widget your customers will love.</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-card/60">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`flex items-center gap-1.5 text-xs md:text-sm font-medium px-3 md:px-4 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={current.id === "widget" ? "max-w-sm mx-auto" : ""}>
          <BrowserFrame>
            <img
              src={current.img}
              alt={`BookSuite ${current.label}`}
              width={current.w}
              height={current.h}
              loading="lazy"
              className="block w-full h-auto"
            />
          </BrowserFrame>
        </div>

        <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto mt-6">{current.caption}</p>
      </div>
    </section>
  );
};

export default ProductShowcase;
