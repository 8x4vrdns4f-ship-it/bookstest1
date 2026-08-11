import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Users, StickyNote, Play, Check, UserX, Timer } from "lucide-react";
import { EmployeeBooking, formatTime } from "./types";

type Props = {
  booking: EmployeeBooking | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onRunningLate?: (id: string) => Promise<void>;
};

const actions = [
  { status: "in_progress", label: "Start", icon: Play },
  { status: "completed", label: "Mark completed", icon: Check },
  { status: "no_show", label: "Mark no-show", icon: UserX },
];

export default function BookingDetailSheet({ booking, open, onOpenChange, onStatusChange, onRunningLate }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  if (!booking) return null;

  const run = async (status: string) => {
    setSaving(status);
    try {
      await onStatusChange(booking.id, status);
      onOpenChange(false);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[20px] max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-foreground">{booking.client_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">{booking.status.replace("_", " ")}</Badge>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock size={14} /> {formatTime(booking.booking_time)} · {booking.duration_minutes} min
            </span>
            {booking.party_size ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users size={14} /> {booking.party_size}
              </span>
            ) : null}
          </div>

          <div className="rounded-[14px] border border-border bg-secondary/40 p-3">
            <p className="text-sm text-foreground font-medium">{booking.service}</p>
            {booking.service_price != null && (
              <p className="text-xs text-muted-foreground mt-0.5">£{Number(booking.service_price).toFixed(2)}</p>
            )}
          </div>

          {booking.notes && (
            <div className="rounded-[14px] border border-border p-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <StickyNote size={13} /> Notes
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {booking.client_email && (
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <a href={`mailto:${booking.client_email}`}>
                <Mail size={16} /> {booking.client_email}
              </a>
            </Button>
          )}

          <div className="grid gap-2 pt-2">
            {actions.map(({ status, label, icon: Icon }) => (
              <Button
                key={status}
                variant={status === "completed" ? "default" : "outline"}
                disabled={saving !== null || booking.status === status}
                onClick={() => run(status)}
                className="w-full justify-start gap-2 h-11"
              >
                <Icon size={16} /> {saving === status ? "Saving…" : label}
              </Button>
            ))}
            {onRunningLate && (
              <Button
                variant="outline"
                disabled={saving !== null}
                onClick={async () => {
                  setSaving("late");
                  try {
                    await onRunningLate(booking.id);
                  } finally {
                    setSaving(null);
                  }
                }}
                className="w-full justify-start gap-2 h-11"
              >
                <Timer size={16} /> {saving === "late" ? "Saving…" : "I'm running late"}
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Need to cancel or reschedule? Ask your manager.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
