import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { getDashboardRoute } from "@/lib/routeAfterAuth";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fireWelcome = async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      if (!user.email) return;
      const { sendEmail } = await import("@/lib/sendEmail");
      const displayName = (user.user_metadata?.display_name as string | undefined) || undefined;
      sendEmail("welcome", user.email, `welcome-${user.id}`, {
        name: displayName,
        dashboardUrl: `${window.location.origin}/dashboard`,
      });
    };

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        navigate("/auth");
        return;
      }
      setEmail(user.email ?? null);
      setChecking(false);
      if (user.email_confirmed_at) {
        fireWelcome(user);
        const route = await getDashboardRoute();
        navigate(route, { replace: true });
      }
    };

    check();
    const interval = setInterval(check, 4000);

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email_confirmed_at) {
        fireWelcome(session.user);
        const route = await getDashboardRoute();
        navigate(route, { replace: true });
      }
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    setResending(false);
    if (error) {
      toast({ title: "Couldn't resend", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email sent", description: "Check your inbox for the verification link." });
      setCooldown(60);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Verify your email — BookSuite" description="Confirm your email to access your BookSuite dashboard." path="/verify-email" />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <CardDescription className="text-muted-foreground">
              {checking ? "Loading…" : (
                <>We've sent a verification link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account — you'll be logged in automatically.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Wrong email?{" "}
              <button onClick={handleSignOut} className="text-primary hover:text-primary/80 font-semibold">
                Sign out and try again
              </button>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Didn't get it? Check your spam folder. This page will refresh automatically once you verify.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
