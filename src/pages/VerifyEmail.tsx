import { publicOrigin } from "@/lib/publicUrl";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { getDashboardRoute } from "@/lib/routeAfterAuth";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  const storedEmailKey = "booksuite.pendingVerificationEmail";

  useEffect(() => {
    let cancelled = false;

    const initialParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const urlError = initialParams.get("error_description") || hashParams.get("error_description") || initialParams.get("error") || hashParams.get("error");
    const pendingEmail = (location.state as { email?: string } | null)?.email || localStorage.getItem(storedEmailKey) || "";

    if (urlError) {
      setLinkError(decodeURIComponent(urlError.replace(/\+/g, " ")));
      setManualEmail(pendingEmail);
      setEmail(pendingEmail || null);
      setChecking(false);
      return () => {
        cancelled = true;
      };
    }

    const fireWelcome = async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      if (!user.email) return;
      const { sendEmail } = await import("@/lib/sendEmail");
      const displayName = (user.user_metadata?.display_name as string | undefined) || undefined;
      sendEmail("welcome", user.email, `welcome-${user.id}`, {
        name: displayName,
        dashboardUrl: `${publicOrigin()}/dashboard`,
      });
    };

    const finishVerification = async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      fireWelcome(user);
      localStorage.removeItem(storedEmailKey);
      const rawNext = new URLSearchParams(window.location.search).get("next") ?? "";
      if (/^\/(?!\/)/.test(rawNext)) {
        window.location.href = rawNext;
        return;
      }
      const route = await getDashboardRoute();
      navigate(route, { replace: true });
    };

    const check = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (error && !cancelled) {
          const { data: { user: existingUser } } = await supabase.auth.getUser();
          if (existingUser?.email_confirmed_at) {
            finishVerification(existingUser);
            return;
          }
          setLinkError(error.message);
          setChecking(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        const pendingEmail = (location.state as { email?: string } | null)?.email || localStorage.getItem(storedEmailKey) || "";
        setManualEmail(pendingEmail);
        setEmail(pendingEmail || null);
        setChecking(false);
        return;
      }
      setEmail(user.email ?? null);
      if (user.email) localStorage.setItem(storedEmailKey, user.email);
      setChecking(false);
      if (user.email_confirmed_at) {
        finishVerification(user);
      }
    };

    check();
    const interval = setInterval(check, 4000);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        setTimeout(() => finishVerification(session.user), 0);
      }
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.subscription.unsubscribe();
    };
  }, [location.state, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    const targetEmail = (email || manualEmail).trim();
    if (!targetEmail || cooldown > 0) {
      toast({ title: "Email required", description: "Enter the email address you used to sign up.", variant: "destructive" });
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo: `${publicOrigin()}/verify-email` },
    });
    setResending(false);
    if (error) {
      toast({ title: "Couldn't resend", description: error.message, variant: "destructive" });
    } else {
      localStorage.setItem(storedEmailKey, targetEmail);
      setEmail(targetEmail);
      setManualEmail(targetEmail);
      setLinkError(null);
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
      <SEO title="Verify your email — BookSuite" description="Confirm your email to access your BookSuite dashboard." path="/verify-email" noIndex />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <CardDescription className="text-muted-foreground">
              {checking ? "Loading…" : linkError ? (
                <>That verification link is no longer valid. Send yourself a fresh one below.</>
              ) : email ? (
                <>We've sent a verification link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account — you'll be logged in automatically.</>
              ) : (
                <>Enter the email you used to sign up and we'll send a new verification link.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {linkError}
              </p>
            )}
            {!email && !checking && (
              <div className="space-y-2">
                <label htmlFor="verification-email" className="text-sm font-medium text-foreground">Email</label>
                <Input
                  id="verification-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={manualEmail}
                  onChange={(event) => setManualEmail(event.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            <Button
              onClick={handleResend}
              disabled={resending || cooldown > 0 || checking}
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
