import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const JoinCompanyDialog = ({ trigger }: { trigger?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<null | string>(null);
  const { toast } = useToast();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sign up (or sign in) so we have an authenticated session for the RPC.
      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role: "employee", display_name: name },
          emailRedirectTo: `${window.location.origin}/pending-approval`,
        },
      });
      let uid = signUp?.user?.id;
      if (signErr) {
        const msg = signErr.message?.toLowerCase() ?? "";
        const exists = msg.includes("already") || msg.includes("registered");
        if (!exists) throw signErr;
        const { data: si, error: siErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (siErr) throw new Error("Account already exists. Use the password you set previously, or reset it.");
        uid = si.user?.id;
      }
      if (!uid) throw new Error("Could not create or sign in to your account.");

      // Ensure session
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const { error: siErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (siErr) throw siErr;
      }

      // Try the legacy pre-add invite path first (auto-approved)
      const { data: claim, error: claimErr } = await supabase.rpc("claim_employee_seat", {
        p_company_code: code.trim().toUpperCase(),
      });
      if (!claimErr && claim) {
        toast({ title: "Welcome to the team!" });
        setOpen(false);
        window.location.href = "/employee-dashboard";
        return;
      }

      // Otherwise create a join request
      const { data: req, error: reqErr } = await supabase.rpc("request_to_join_company", {
        p_company_code: code.trim().toUpperCase(),
        p_name: name,
        p_phone: phone,
      });
      if (reqErr) {
        if ((reqErr.message || "").includes("Company code not found")) throw new Error("Company code not found.");
        if ((reqErr.message || "").includes("already a member")) throw new Error("You're already a member of this company. Log in instead.");
        throw reqErr;
      }
      const row = Array.isArray(req) ? req[0] : req;
      const biz = row?.business_name || "the company";

      // Sign out so they can't access anything until approved
      await supabase.auth.signOut();
      setSubmitted(biz);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit request.";
      toast({ title: "Request failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitted(null); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
            <Users size={16} />
            Join a Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {submitted ? "Request submitted ✓" : "Request to Join a Company"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {submitted
              ? `Your request to join ${submitted} is pending approval. You can't log in yet — we'll email you once a manager accepts you in.`
              : "Enter your company code and your details. A manager will review your request before you can sign in."}
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <Button onClick={() => { setOpen(false); setSubmitted(null); }} className="mt-3 w-full">Got it</Button>
        ) : (
          <form onSubmit={handleRequest} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-foreground">Company Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BS-XXXXXX" required className="bg-secondary border-border font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border" />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Your Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">Create Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required className="bg-secondary border-border pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              {loading ? "Submitting…" : "Request to Join Company"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JoinCompanyDialog;
