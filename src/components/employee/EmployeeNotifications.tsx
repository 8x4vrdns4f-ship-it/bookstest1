import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmployeeNotification, relativeTime } from "./types";

type Props = {
  items: EmployeeNotification[];
  onMarkAllRead: () => void;
  onSelect: (n: EmployeeNotification) => void;
};

export default function EmployeeNotifications({ items, onMarkAllRead, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-[11px] text-primary inline-flex items-center gap-1"
            >
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Nothing yet.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  onSelect(n);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors"
              >
                <p className="text-sm text-foreground font-medium flex items-center gap-2">
                  {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  {n.title}
                </p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{relativeTime(n.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
