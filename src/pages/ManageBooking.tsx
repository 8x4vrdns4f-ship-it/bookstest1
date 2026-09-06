import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Clock, MapPin, Phone, User, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SEO from "@/components/SEO";

interface BookingInfo {
  id: string;
  service: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  client_name: string;
  status: string;
  deposit_amount: number | null;
  payment_status: string;
  confirmation_code: string | null;
}

interface BusinessInfo {
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  cancellation_hours?: number;
  currency?: string;
}

const ManageBooking = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [business, setBusiness] = useState<BusinessInfo>({});
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-client-booking", {
          body: { token },
        });
        if (fnError || !data?.ok) {
          setError(data?.error || "Could not load booking");
        } else {
          setBooking(data.booking);
          setBusiness(data.business || {});
        }
      } catch (e) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    try {
      const { data } = await supabase.functions.invoke("cancel-booking-client", {
        body: { token },
      });
      if (data?.ok) {
        setCancelled(true);
        setBooking((prev) => prev ? { ...prev, status: "cancelled_by_client" } : prev);
      } else {
        setError(data?.error || "Could not cancel booking");
      }
    } catch {
      setError("Could not cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  const canCancel = booking && !["cancelled_by_client", "cancelled", "completed", "no_show"].includes(booking.status);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Manage your booking — BookSuite" description="View or cancel your booking" path={`/booking/manage/${token}`} noIndex />
      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !booking ? null : (
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {cancelled ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Booking cancelled
                  </span>
                ) : (
                  "Your booking"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.client_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{fmtDate(booking.booking_date)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{(booking.booking_time || "").slice(0, 5)} · {booking.duration_minutes} min</span>
                </div>
                {business.business_address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{business.business_address}</span>
                  </div>
                )}
                {business.business_phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{business.business_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Service:</span>
                  <span>{booking.service}</span>
                </div>
                {booking.confirmation_code && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-mono font-semibold">{booking.confirmation_code}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={
                    booking.status === "confirmed" ? "text-success font-medium" :
                    booking.status === "cancelled_by_client" ? "text-muted-foreground" :
                    "text-foreground"
                  }>
                    {booking.status === "cancelled_by_client" ? "Cancelled" :
                     booking.status === "confirmed" ? "Confirmed" :
                     booking.status}
                  </span>
                </div>
                {booking.deposit_amount && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span>{(business.currency || "GBP").toUpperCase()} {Number(booking.deposit_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {cancelled && (
                <p className="text-sm text-muted-foreground">
                  {booking.payment_status === "refunded"
                    ? "Your deposit has been refunded."
                    : "Your cancellation has been processed."}
                </p>
              )}

              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-2">
                      <XCircle className="h-4 w-4" />
                      Cancel booking
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        You must cancel at least {business.cancellation_hours ?? 24} hours before the appointment.
                        If you are inside the window, the deposit may not be refunded automatically.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <Button variant="outline">Keep booking</Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          variant="destructive"
                          onClick={handleCancel}
                          disabled={cancelling}
                        >
                          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, cancel"}
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate("/my-bookings")}>
                See all my bookings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManageBooking;
