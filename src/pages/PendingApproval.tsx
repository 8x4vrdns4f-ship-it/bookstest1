import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const PendingApproval = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "pending" | "declined" | "none">("loading");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase
        .from("employee_join_requests")
        .select("status, decline_reason")
        .eq("requester_auth_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) setStatus("none");
      else if (data.status === "declined") { setStatus("declined"); setReason(data.decline_reason || ""); }
      else setStatus("pending");
    })();
  }, [navigate]);

  const signOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Waiting for approval — BookSuite" description="Your request to join a company is pending approval." path="/pending-approval" noIndex />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6">
        <Card className="bg-card border-border max-w-md w-full">
          <CardHeader className="text-center">
            <Clock className="mx-auto text-primary mb-3" size={36} />
            <CardTitle className="text-foreground">
              {status === "declined" ? "Request declined" : "Waiting for approval"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "loading" && <p className="text-muted-foreground">Checking your request…</p>}
            {status === "pending" && (
              <p className="text-muted-foreground">
                Your account is waiting for a manager to approve your request. We'll send you an email with your details as soon as you're accepted.
              </p>
            )}
            {status === "declined" && (
              <>
                <p className="text-muted-foreground">A manager declined your request.</p>
                {reason && <p className="text-sm text-foreground italic">"{reason}"</p>}
              </>
            )}
            {status === "none" && (
              <p className="text-muted-foreground">No pending request found for this account.</p>
            )}
            <Button onClick={signOut} variant="outline" className="gap-2 mt-2">
              <LogOut size={16} /> Sign out
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PendingApproval;
