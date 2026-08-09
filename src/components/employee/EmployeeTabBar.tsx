import { CalendarClock, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmployeeTab = "today" | "schedule" | "profile";

const tabs: { key: EmployeeTab; label: string; icon: typeof CalendarClock }[] = [
  { key: "today", label: "Today", icon: CalendarClock },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "profile", label: "Profile", icon: User },
];

type Props = { value: EmployeeTab; onChange: (t: EmployeeTab) => void };

export default function EmployeeTabBar({ value, onChange }: Props) {
  return (
    <nav
      aria-label="Employee sections"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:static sm:border sm:rounded-[16px] sm:bg-card sm:backdrop-blur-none"
    >
      <div className="max-w-3xl mx-auto grid grid-cols-3">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors min-h-[56px]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={20} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
