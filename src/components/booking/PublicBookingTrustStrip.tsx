import { ShieldCheck, Zap, CalendarX } from "lucide-react";

interface Props {
  cancellationHours?: number | null;
}

const PublicBookingTrustStrip = ({ cancellationHours }: Props) => {
  const items = [
    { icon: ShieldCheck, label: "Secure booking" },
    { icon: Zap, label: "Instant confirmation" },
    {
      icon: CalendarX,
      label: cancellationHours && cancellationHours > 0
        ? `Free cancellation up to ${cancellationHours}h before`
        : "Flexible cancellation",
    },
  ];
  return (
    <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 text-xs text-muted-foreground"
        >
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};

export default PublicBookingTrustStrip;
