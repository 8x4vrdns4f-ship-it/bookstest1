import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { setPortalSession, verifyPortalLink } from "@/lib/clientPortal";

const MyBookingsVerify = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = params.get("token");
    if (!token) {
      setError("This link is not valid.");
      return;
    }
    verifyPortalLink(token)
      .then((res) => {
        setPortalSession(res.session_token, res.email, res.expires_at);
        navigate("/my-bookings", { replace: true });
      })
      .catch((e: Error) => setError(e.message));
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO
        title="Signing you in — BookSuite"
        description="Opening your bookings."
        path="/my-bookings/verify"
        noIndex
      />
      <div className="w-full max-w-sm text-center space-y-4">
        {error ? (
          <>
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => navigate("/my-bookings")}>
              Get a new link
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Opening your bookings…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookingsVerify;
