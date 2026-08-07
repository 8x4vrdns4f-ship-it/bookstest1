import { useState } from "react";
import { LayoutDashboard, Calendar, Smartphone, Check } from "lucide-react";
import dashboardShot from "@/assets/shot-dashboard.jpg";
import calendarShot from "@/assets/shot-calendar.jpg";
import widgetShot from "@/assets/shot-widget.jpg";

type Tab = "dashboard" | "calendar" | "widget";

const TABS: {
  id: Tab;
  label: string;
  blurb: string;
  icon: typeof LayoutDashboard;
  caption: string;
  points: string[];
  img: string;
  w: number;
  h: number;
  url: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    blurb: "Run the whole business",
    icon: LayoutDashboard,
    caption:
      "Every booking, client, payment, and team member in one place — with the numbers that actually matter surfaced up top.",
    points: ["Revenue and no-show stats at a glance", "Clients, staff and payouts in one view", "Setup checklist for new businesses"],
    img: dashboardShot,
    w: 1600,
    h: 1008,
    url: "app.booksuite.online/dashboard",
  },
  {
    id: "calendar",
    label: "Calendar",
    blurb: "Never double-book again",
    icon: Calendar,
    caption:
      "Drag, drop, and colour-code by staff. See your whole week at a glance and stop double-booking forever.",
    points: ["Day, week and staff views", "Colour-coded by team member", "Blocks out busy time automatically"],
    img: calendarShot,
    w: 1600,
    h: 1008,
    url: "app.booksuite.online/dashboard/calendar",
  },
  {
    id: "widget",
    label: "Booking widget",
    blurb: "Take bookings 24/7",
    icon: Smartphone,
    caption:
      "One snippet of code and your customers can book on your site 24/7 — with deposits, party size, and resource picking built in.",
    points: ["Embed on any website in one line", "Takes deposits or full payment", "Pick a service, staff member or table"],
    img: widgetShot,
    w: 912,
    h: 1200,
    url: "yourbusiness.com/book",
  },
];

const BrowserFrame = ({ url, children }: { url: string; children: React.ReactNode }) => (
  <div className="rounded-2xl overflow-hidden border border-border bg-card/60 shadow-2xl">
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-card/80">
      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
      <span className="ml-4 truncate rounded-md bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground tracking-wide">
        {url}
      </span>
    </div>
    {children}
  </div>
);

const ProductShowcase = () => {
  const [active, setActive] = useState<Tab>("dashboard");
  const current = TABS.find((t) => t.id === active)!;

  return (
    <section className="px-6 md:px-16 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Product tour
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">See BookSuite in action</h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Three screens run your entire business. Tap through the tour.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-10 lg:items-start">
          {/* Tab rail */}
          <div
            role="tablist"
            aria-label="Product screens"
            className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(t.id)}
                  className={`group min-w-[220px] lg:min-w-0 flex-1 lg:flex-none text-left rounded-2xl border p-4 transition-all ${
                    isActive
                      ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                      : "border-border bg-card/50 hover:border-primary/30 hover:bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{t.label}</span>
                      <span className="block text-xs text-muted-foreground truncate">{t.blurb}</span>
                    </span>
                  </div>

                  {isActive && (
                    <ul className="mt-4 hidden space-y-2 lg:block">
                      {t.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check size={13} className="mt-0.5 shrink-0 text-primary" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>

          {/* Screen */}
          <div>
            <div className={current.id === "widget" ? "max-w-sm mx-auto" : ""}>
              <BrowserFrame url={current.url}>
                <img
                  key={current.id}
                  src={current.img}
                  alt={`BookSuite ${current.label}`}
                  width={current.w}
                  height={current.h}
                  loading="lazy"
                  className="block w-full h-auto"
                />
              </BrowserFrame>
            </div>
            <p className="mt-5 text-center text-sm text-muted-foreground max-w-2xl mx-auto lg:text-left">
              {current.caption}
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 lg:hidden">
              {current.points.map((p) => (
                <li key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check size={13} className="text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
