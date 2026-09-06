import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, LogOut, Mail, CheckCircle2 } from "lucide-react";
import SEO from "@/components/SEO";
import PortalBookingCard from "@/components/portal/PortalBookingCard";
import PortalDetailsDialog from "@/components/portal/PortalDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import {
  PortalBooking, clearPortalSession, fetchPortalBookings, getPortalSession,
  isClosedStatus, isPastBooking, requestPortalLink,
} from "@/lib/clientPortal";

const MyBookings = () => {
  const { toast } = useToast();
  const [session, setSession] = useState(getPortalSession());
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<PortalBooking[]>([]);
  const [profile, setProfile] = useState<{ name: string | null; phone: string | null }>({ name: null, phone: null });

  const load = useCallback(async () => {
    const current = getPortalSession();
    if (!current) { setSession(null); return; }
    setLoading(true);
    try {
      const res = await fetchPortalBookings(current.token);
      setBookings(res.bookings);
      setProfile(res.profile);
    } catch (e) {
      const msg = (e as Error).message;
      if (/session/i.test(msg)) {
        clearPortalSession();
        setSession(null);
        toast({ title: "Please sign in again", description: "Your link has expired." });
      } else {
        toast({ title: "Could not load your bookings", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { if (session) load(); }, [session, load]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await requestPortalLink(email);
      setSent(true);
    } catch (err) {
      toast({ title: "Could not send link", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const signOut = () => {
    clearPortalSession();
    setSession(null);
    setBookings([]);
    setSent(false);
    setEmail("");
  };

  const upcoming = bookings
    .filter((b) => !isPastBooking(b) && !isClosedStatus(b.status))
    .sort((a, b) => `${a.booking_date}${a.booking_time}`.localeCompare(`${b.booking_date}${b.booking_time}`));
  const previous = bookings
    .filter((b) => isPastBooking(b) || isClosedStatus(b.status))
    .sort((a, b) => `${b.booking_date}${b.booking_time}`.localeCompare(`${a.booking_date}${a.booking_time}`));

  const seo = (
    <SEO
      title="My bookings — BookSuite"
      description="View, reschedule or cancel your bookings."
      path="/my-bookings"
      noIndex
    />
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {seo}
        <Card className="w-full max-w-sm surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-primary" />
              My bookings
            </CardTitle>
            <CardDescription>
              Enter the email you booked with and we'll send you a secure link — no password needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <Alert className="border-primary/30">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  If we have bookings for that email, a sign-in link is on its way. It expires in 30 minutes.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={submitEmail} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="portal-email">Email address</Label>
                  <Input
                    id="portal-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={sending}>
                  <Mail className="h-4 w-4" />
                  {sending ? "Sending…" : "Send me a link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12 space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My bookings</h1>
            <p className="text-sm text-muted-foreground">{session.email}</p>
          </div>
          <div className="flex gap-2">
            <PortalDetailsDialog
              sessionToken={session.token}
              email={session.email}
              name={profile.name}
              phone={profile.phone}
              onSaved={load}
            />
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="surface-card">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No bookings found for this email yet.
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing coming up.</p>
              ) : (
                upcoming.map((b) => (
                  <PortalBookingCard key={b.id} booking={b} sessionToken={session.token} onChanged={load} />
                ))
              )}
            </section>

            {previous.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Past ({previous.length})
                </h2>
                {previous.map((b) => (
                  <PortalBookingCard key={b.id} booking={b} sessionToken={session.token} onChanged={load} />
                ))}
              </section>
            )}
          </>
        )}

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a href="https://booksuite.online" className="font-medium text-foreground hover:text-primary">
            BookSuite
          </a>
        </footer>
      </div>
    </div>
  );
};

export default MyBookings;
