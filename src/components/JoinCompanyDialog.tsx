import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Try to create the auth account marked as employee.
      //    If the user already exists, fall back to signing in with the supplied password.
      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role: "employee", display_name: email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/employee-dashboard`,
        },
      });

      let newUserId: string | undefined = signUp?.user?.id;

      if (signErr) {
        const msg = signErr.message?.toLowerCase() ?? "";
        const alreadyExists = msg.includes("already") || msg.includes("registered");
        if (!alreadyExists) throw signErr;
        // user exists — sign in instead
        const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (siErr) throw new Error("Account already exists. Use the password you set previously, or reset it.");
        newUserId = si.user?.id;
      }

      if (!newUserId) throw new Error("Could not create or sign in to your account.");

      // 2. Find the company by code
      const { data: business, error: bizErr } = await supabase
        .from("business_settings")
        .select("user_id, business_name, company_code")
        .eq("company_code", code.trim().toUpperCase())
        .maybeSingle();
      if (bizErr) throw bizErr;
      if (!business) throw new Error("Company code not found.");

      // 3. Make sure we have an authenticated session before the update
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInErr) throw signInErr;
      }

      // 4. Link the employees row by email
      const { data: empRow, error: empErr } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", business.user_id)
        .eq("email", email.trim())
        .maybeSingle();
      if (empErr) throw empErr;
      if (!empRow) throw new Error("Your email isn't on the company's employee list. Ask the owner to add you first.");

      const { error: linkErr } = await supabase
        .from("employees")
        .update({ auth_user_id: newUserId })
        .eq("id", empRow.id);
      if (linkErr) throw linkErr;

      toast({ title: `Welcome to ${business.business_name || "the team"}!` });
      setOpen(false);
      navigate("/employee-dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not join.";
      toast({ title: "Join failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogTitle className="text-foreground">Join a Company</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the company code your employer sent you, plus your work email and a new password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoin} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-foreground">Company Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BS-XXXXXX" required className="bg-secondary border-border font-mono" />
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
            {loading ? "Joining…" : "Join Company"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinCompanyDialog;
