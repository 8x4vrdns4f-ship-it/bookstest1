import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarPlus, Clock, Loader2, MapPin, Phone, RotateCcw, Star, XCircle, Navigation,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PortalBooking, cancelPortalBooking, currencySymbol, isClosedStatus, isPastBooking, statusLabel,
} from "@/lib/clientPortal";
import { downloadIcs, googleCalendarUrl } from "@/lib/ics";
import RescheduleDialog from "./RescheduleDialog";

interface Props {
  booking: PortalBooking;
  sessionToken: string;
  onChanged: () => void;
}

const prettyDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const PortalBookingCard = ({ booking, sessionToken, onChanged }: Props) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const past = isPastBooking(booking);
  const closed = isClosedStatus(booking.status);
  const canChange = !past && !closed;
  const biz = booking.business;
  const amount = booking.charge_amount ?? booking.deposit_amount;
  const time = (booking.booking_time || "").slice(0, 5);

  const calendarEvent = {
    title: `${booking.service} — ${biz.business_name || "Booking"}`,
    description: booking.confirmation_code ? `Confirmation code: ${booking.confirmation_code}` : undefined,
    location: biz.business_address || undefined,
    date: booking.booking_date,
    time,
    durationMinutes: booking.duration_minutes,
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await cancelPortalBooking(sessionToken, booking.id);
      toast({
        title: "Booking cancelled",
        description: res.refunded ? "Your deposit has been refunded." : undefined,
      });
      onChanged();
    } catch (e) {
      toast({ title: "Could not cancel", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card className="surface-card overflow-hidden">
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{biz.business_name || "Business"}</p>
            <h3 className="text-base md:text-lg font-semibold truncate">{booking.service}</h3>
          </div>
          <Badge variant={closed ? "secondary" : past ? "secondary" : "default"} className="shrink-0">
            {statusLabel(booking.status)}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm">
          <p className="font-medium">{prettyDate(booking.booking_date)}</p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {time} · {booking.duration_minutes} min
            {booking.party_size ? ` · ${booking.party_size} people` : ""}
          </p>
          {biz.business_address && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{biz.business_address}</span>
            </p>
          )}
          {biz.business_phone && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <a href={`tel:${biz.business_phone}`} className="hover:text-foreground">{biz.business_phone}</a>
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-muted-foreground">
            {booking.confirmation_code && (
              <span>Code <span className="font-mono font-semibold text-foreground">{booking.confirmation_code}</span></span>
            )}
            {amount != null && Number(amount) > 0 && (
              <span>
                {booking.payment_status === "refunded" ? "Refunded " : "Paid "}
                <span className="text-foreground font-medium">
                  {currencySymbol(biz.currency)}{Number(amount).toFixed(2)}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {canChange && (
            <>
              <RescheduleDialog booking={booking} sessionToken={sessionToken} onDone={onChanged} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cancellations must be made at least {biz.cancellation_hours ?? 24} hours before
                      the appointment. Any deposit is refunded automatically where the business allows it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, cancel"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost" size="sm" className="gap-1.5"
                onClick={() => downloadIcs(calendarEvent, `${booking.service}.ics`)}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Add to calendar
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                <a href={googleCalendarUrl(calendarEvent)} target="_blank" rel="noopener noreferrer">
                  Google Calendar
                </a>
              </Button>
            </>
          )}

          {biz.business_address && (
            <Button variant="ghost" size="sm" className="gap-1.5" asChild>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.business_address)}`}
                target="_blank" rel="noopener noreferrer"
              >
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </a>
            </Button>
          )}

          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <a href={`/book/${booking.user_id}`}>
              <RotateCcw className="h-3.5 w-3.5" />
              Book again
            </a>
          </Button>

          {past && booking.review_token && !booking.review_submitted_at && (
            <Button variant="ghost" size="sm" className="gap-1.5" asChild>
              <a href={`/review/${booking.review_token}`}>
                <Star className="h-3.5 w-3.5" />
                Leave a review
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortalBookingCard;
