import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppDialog } from "@/components/app/AppDialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinCompanySchema, type JoinCompanyForm } from "@/lib/formSchemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const JoinCompanyDialog = ({ trigger }: { trigger?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<null | string>(null);
  const { toast } = useToast();

  const form = useForm<JoinCompanyForm>({
    resolver: zodResolver(joinCompanySchema),
    defaultValues: { code: "", name: "", phone: "", email: "", password: "" },
  });

  const onSubmit = async (values: JoinCompanyForm) => {
    setLoading(true);
    try {
      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: { role: "employee", display_name: values.name },
          emailRedirectTo: `${window.location.origin}/pending-approval`,
        },
      });
      let uid = signUp?.user?.id;
      if (signErr) {
        const msg = signErr.message?.toLowerCase() ?? "";
        const exists = msg.includes("already") || msg.includes("registered");
        if (!exists) throw signErr;
        const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });
        if (siErr) throw new Error("Account already exists. Use the password you set previously, or reset it.");
        uid = si.user?.id;
      }
      if (!uid) throw new Error("Could not create or sign in to your account.");

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const { error: siErr } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });
        if (siErr) throw siErr;
      }

      const { data: claim, error: claimErr } = await supabase.rpc("claim_employee_seat", {
        p_company_code: values.code.trim().toUpperCase(),
      });
      if (!claimErr && claim) {
        toast({ title: "Welcome to the team!" });
        setOpen(false);
        window.location.href = "/employee-dashboard";
        return;
      }

      const { data: req, error: reqErr } = await supabase.rpc("request_to_join_company", {
        p_company_code: values.code.trim().toUpperCase(),
        p_name: values.name,
        p_phone: values.phone,
      });
      if (reqErr) {
        if ((reqErr.message || "").includes("Company code not found")) throw new Error("Company code not found.");
        if ((reqErr.message || "").includes("already a member")) throw new Error("You're already a member of this company. Log in instead.");
        throw reqErr;
      }
      const row = Array.isArray(req) ? req[0] : req;
      const biz = row?.business_name || "the company";
      const requestId = row?.request_id;

      try {
        const { data: bs } = await supabase
          .from("business_settings")
          .select("user_id")
          .eq("company_code", values.code.trim().toUpperCase())
          .maybeSingle();
        if (bs?.user_id) {
          const { data: ownerEmail } = await supabase.rpc("get_owner_email", { _user_id: bs.user_id });
          if (ownerEmail) {
            const { sendEmail } = await import("@/lib/sendEmail");
            sendEmail("join-request-received-owner", ownerEmail as unknown as string,
              `join-received-${requestId || `${bs.user_id}-${values.email}`}`,
              {
                applicantName: values.name,
                applicantEmail: values.email.trim(),
                applicantPhone: values.phone,
                businessName: biz,
                dashboardUrl: `${window.location.origin}/dashboard`,
              });
          }
        }
      } catch (e) { console.error("owner notify failed", e); }

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
    <>
      {trigger ? (
        <button onClick={() => setOpen(true)}>{trigger}</button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
        >
          <Users size={16} />
          Join a Company
        </Button>
      )}
      <AppDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) { setSubmitted(null); form.reset(); } }}
        title={submitted ? "Request submitted ✓" : "Request to Join a Company"}
        description={
          submitted
            ? `Your request to join ${submitted} is pending approval. You can't log in yet — we'll email you once a manager accepts you in.`
            : "Enter your company code and your details. A manager will review your request before you can sign in."
        }
        icon={Building2}
        size="sm"
        footer={
          submitted ? (
            <Button onClick={() => { setOpen(false); setSubmitted(null); form.reset(); }} className="w-full">
              Got it
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {loading ? "Submitting…" : "Request to Join Company"}
              </Button>
            </>
          )
        }
      >
        {!submitted && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="BS-XXXXXX"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="bg-secondary border-border font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-secondary border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-secondary border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} className="bg-secondary border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className="bg-secondary border-border pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
      </AppDialog>
    </>
  );
};

export default JoinCompanyDialog;
