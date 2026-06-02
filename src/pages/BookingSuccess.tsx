import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookingSuccess = () => {
  const { userId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!sessionId) { setState("error"); setError("Missing session id"); return; }
    let cancelled = false;
    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-booking-payment", {
          body: { session_id: sessionId },
        });
        if (cancelled) return;
        if (error) throw error;
        if ((data as any).ok && (data as any).booking) {
          setBooking((data as any).booking);
          setState("ok");
        } else {
          // Payment still processing — retry once
          setTimeout(verify, 2000);
        }
      } catch (e: any) {
        if (!cancelled) { setError(e.message || "Verification failed"); setState("error"); }
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto text-accent animate-spin mb-4" size={48} />
            <h1 className="text-xl font-bold text-foreground mb-2">Confirming your booking…</h1>
            <p className="text-sm text-muted-foreground">Just a moment.</p>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="mx-auto text-green-400 mb-4" size={56} />
            <h1 className="text-2xl font-bold text-foreground mb-2">Booking confirmed!</h1>
            <p className="text-sm text-muted-foreground mb-4">
              We've emailed you the details. Your confirmation code is:
            </p>
            <div className="bg-secondary text-foreground rounded-lg py-3 px-4 font-mono text-lg tracking-widest mb-6">
              {booking?.confirmation_code || "—"}
            </div>
            <Button onClick={() => navigate(`/book/${userId}`)} variant="outline">
              Book another
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto text-red-400 mb-4" size={48} />
            <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate(`/book/${userId}`)} variant="outline">
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingSuccess;
