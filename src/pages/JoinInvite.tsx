import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const JoinInvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const code = (params.get("code") || "").toUpperCase();
  const invitedEmail = params.get("email") || "";

  const [businessName, setBusinessName] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [alreadySignedIn, setAlreadySignedIn] = useState(false);


  useEffect(() => {
    (async () => {
      // If a different account is already signed in on this device (e.g. the owner),
      // sign it out so the invite is claimed by the invited person, not the current session.
      const { data: sess } = await supabase.auth.getSession();
      const current = (sess.session?.user.email || "").toLowerCase();
      if (current && invitedEmail && current !== invitedEmail.toLowerCase()) {
        await supabase.auth.signOut();
      } else if (current && invitedEmail && current === invitedEmail.toLowerCase()) {
        setAlreadySignedIn(true);
      }

      if (!code) { setChecking(false); return; }
      const { data } = await supabase.rpc("lookup_business_by_code", { p_code: code });
      const row = Array.isArray(data) ? data[0] : data;
      setBusinessName((row as { business_name?: string } | null)?.business_name || null);
      setChecking(false);
    })();
  }, [code, invitedEmail]);

  const finish = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const signedInEmail = sess.session?.user.email || email.trim();

    // Try code-based claim first, then email-based fallback
    const { error: claimErr } = await supabase.rpc("claim_employee_seat", { p_company_code: code });
    if (claimErr) {
      const { data: byEmail } = await supabase.rpc("claim_employee_seat_by_email");
      const row = Array.isArray(byEmail) ? byEmail[0] : byEmail;
      if (!row) {
        toast({
          title: "Invite not found",
          description: `No open invite matches ${signedInEmail}. Ask your manager to resend the invite to that exact address.`,
          variant: "destructive",
        });
        return;
      }
    }
    toast({ title: "Welcome to the team!" });
    const { getDashboardRoute } = await import("@/lib/routeAfterAuth");
    navigate(await getDashboardRoute(), { replace: true });
  };

  const joinAsCurrentUser = async () => {
    setLoading(true);
    try { await finish(); } finally { setLoading(false); }
  };



  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        const { error: signErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { role: "employee" },
            emailRedirectTo: `${window.location.origin}/join?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email.trim())}`,
          },
        });
        if (signErr) {
          const msg = (signErr.message || "").toLowerCase();
          if (msg.includes("already") || msg.includes("registered")) {
            setMode("signin");
            throw new Error("You already have an account — enter your password to sign in and join.");
          }
          throw signErr;
        }
      }

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const { error: siErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (siErr) {
          if ((siErr.message || "").toLowerCase().includes("confirm")) {
            setNeedsVerify(true);
            return;
          }
          throw siErr;
        }
      }

      await finish();
    } catch (err) {
      toast({
        title: "Couldn't join",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Join your team — BookSuite" description="Accept your team invite and join your company on BookSuite." path="/join" noIndex />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="bg-card border-border max-w-md w-full">
          <CardHeader className="text-center">
            <Building2 className="mx-auto text-primary mb-3" size={34} />
            <CardTitle className="text-foreground">
              {checking
                ? "Checking your invite…"
                : businessName
                  ? `Join ${businessName}`
                  : "Join your team"}
            </CardTitle>
            {!checking && (
              <p className="text-sm text-muted-foreground mt-2">
                {needsVerify
                  ? "Almost there — confirm your email address, then open this link again to finish joining."
                  : businessName
                    ? "Set a password to accept your invite. No approval needed — your manager already added you."
                    : "We couldn't find that company code. Check the link in your invite email."}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : needsVerify ? (
              <Button asChild className="w-full"><Link to="/">Back to home</Link></Button>
            ) : !businessName ? (
              <Button asChild variant="outline" className="w-full"><Link to="/auth">Go to sign in</Link></Button>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-email">Email</Label>
                  <Input
                    id="join-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-password">{mode === "create" ? "Create password" : "Your password"}</Label>
                  <div className="relative">
                    <Input
                      id="join-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      className="bg-secondary border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full font-semibold">
                  {loading ? "Joining…" : mode === "create" ? "Join the team" : "Sign in and join"}
                </Button>
                <button
                  type="button"
                  onClick={() => setMode(mode === "create" ? "signin" : "create")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  {mode === "create" ? "I already have an account" : "I need to create an account"}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default JoinInvite;
