import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, Clock, Link2, Check, Copy, ArrowLeft, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  onboardingBusinessSchema, type OnboardingBusinessForm,
} from "@/lib/formSchemas";

const HOUR_PRESETS = [
  {
    id: "mf-9-5",
    label: "Weekdays · 9am – 5pm",
    hours: {
      mon: { open: "09:00", close: "17:00", closed: false },
      tue: { open: "09:00", close: "17:00", closed: false },
      wed: { open: "09:00", close: "17:00", closed: false },
      thu: { open: "09:00", close: "17:00", closed: false },
      fri: { open: "09:00", close: "17:00", closed: false },
      sat: { open: "10:00", close: "16:00", closed: true },
      sun: { open: "10:00", close: "16:00", closed: true },
    },
  },
  {
    id: "ts-10-6",
    label: "Tue – Sat · 10am – 6pm",
    hours: {
      mon: { open: "10:00", close: "18:00", closed: true },
      tue: { open: "10:00", close: "18:00", closed: false },
      wed: { open: "10:00", close: "18:00", closed: false },
      thu: { open: "10:00", close: "18:00", closed: false },
      fri: { open: "10:00", close: "18:00", closed: false },
      sat: { open: "10:00", close: "18:00", closed: false },
      sun: { open: "10:00", close: "18:00", closed: true },
    },
  },
  {
    id: "everyday",
    label: "Every day · 9am – 8pm",
    hours: {
      mon: { open: "09:00", close: "20:00", closed: false },
      tue: { open: "09:00", close: "20:00", closed: false },
      wed: { open: "09:00", close: "20:00", closed: false },
      thu: { open: "09:00", close: "20:00", closed: false },
      fri: { open: "09:00", close: "20:00", closed: false },
      sat: { open: "09:00", close: "20:00", closed: false },
      sun: { open: "09:00", close: "20:00", closed: false },
    },
  },
] as const;

const STEPS = [
  { id: 1, title: "Business basics", icon: Store },
  { id: 2, title: "Your hours", icon: Clock },
  { id: 3, title: "Share your link", icon: Link2 },
  { id: 4, title: "You're all set", icon: Rocket },
] as const;


const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [savingBasics, setSavingBasics] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("mf-9-5");
  const [copied, setCopied] = useState(false);

  const form = useForm<OnboardingBusinessForm>({
    resolver: zodResolver(onboardingBusinessSchema),
    defaultValues: { business_name: "", business_category: "", business_phone: "" },
  });

  // Guard: only for signed-in business owners who haven't finished onboarding.
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const uid = session.user.id;
      setUserId(uid);
      const { data: biz } = await supabase
        .from("business_settings")
        .select("business_name, business_category, business_phone, onboarding_completed_at")
        .eq("user_id", uid)
        .maybeSingle();
      if (!biz) {
        // Employee or unusual state — send them through the normal router.
        navigate("/dashboard", { replace: true });
        return;
      }
      if ((biz as { onboarding_completed_at: string | null }).onboarding_completed_at) {
        navigate("/dashboard", { replace: true });
        return;
      }
      form.reset({
        business_name: biz.business_name ?? "",
        business_category: biz.business_category ?? "",
        business_phone: biz.business_phone ?? "",
      });
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookingUrl = useMemo(
    () => (userId ? `${window.location.origin}/book/${userId}` : ""),
    [userId]
  );

  const markComplete = async () => {
    if (!userId) return;
    await supabase
      .from("business_settings")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("user_id", userId);
  };

  const saveBasics = async (values: OnboardingBusinessForm) => {
    if (!userId) return;
    setSavingBasics(true);
    const { error } = await supabase
      .from("business_settings")
      .update({
        business_name: values.business_name,
        business_category: values.business_category || null,
        business_phone: values.business_phone || null,
      })
      .eq("user_id", userId);
    setSavingBasics(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const saveHoursAndContinue = async () => {
    if (!userId) return;
    const preset = HOUR_PRESETS.find((p) => p.id === selectedPreset) ?? HOUR_PRESETS[0];
    setSavingHours(true);
    const { error } = await supabase
      .from("business_settings")
      .update({ working_hours: preset.hours as never })
      .eq("user_id", userId);
    setSavingHours(false);
    if (error) {
      toast({ title: "Couldn't save hours", description: error.message, variant: "destructive" });
      return;
    }
    setStep(3);
  };

  const finish = async () => {
    setFinishing(true);
    await markComplete();
    setFinishing(false);
    navigate("/dashboard", { replace: true });
  };

  const skip = async () => {
    setFinishing(true);
    await markComplete();
    setFinishing(false);
    toast({
      title: "No problem — you can finish later",
      description: "The 'Get set up' checklist on your dashboard has everything that's left.",
    });
    navigate("/dashboard", { replace: true });
  };


  const copyLink = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const progress = (step / STEPS.length) * 100;
  const current = STEPS[step - 1];
  const CurrentIcon = current.icon;

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Welcome to BookSuite" description="Set up your business in a minute." path="/onboarding" noIndex />

      <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        {/* Stepper */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step} of {STEPS.length}</span>
            <button
              type="button"
              onClick={skip}
              className="underline-offset-4 hover:text-foreground hover:underline"
              disabled={finishing}
            >
              Skip for now
            </button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 shadow-2xl shadow-black/30 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <CurrentIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">{current.title}</h1>
              <p className="text-sm text-muted-foreground">
                {step === 1 && "Tell us a bit about your business."}
                {step === 2 && "Pick a starting schedule — you can fine-tune it later."}
                {step === 3 && "Share this link anywhere to take bookings."}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(saveBasics)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business name</FormLabel>
                          <FormControl><Input placeholder="Acme Salon" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="business_category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl><Input placeholder="Hair salon, PT, tutor…" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="business_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl><Input placeholder="+44 20 1234 5678" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={savingBasics}>
                        {savingBasics ? "Saving…" : "Continue"}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {HOUR_PRESETS.map((preset) => {
                      const active = preset.id === selectedPreset;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedPreset(preset.id)}
                          className={`w-full text-left rounded-xl border p-4 transition-colors ${
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border/60 bg-card/40 hover:border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{preset.label}</span>
                            {active && <Check className="h-4 w-4 text-primary" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can edit individual days later in Settings → Hours.
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={saveHoursAndContinue} disabled={savingHours}>
                      {savingHours ? "Saving…" : "Continue"}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Your booking link</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={bookingUrl} className="font-mono text-xs" />
                      <Button type="button" variant="secondary" onClick={copyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste it in your Instagram bio, on your website, or share it directly with customers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm">
                    <p className="font-medium text-foreground mb-1">Next up: get paid</p>
                    <p className="text-muted-foreground">
                      Connect Stripe from Settings → Payments to start taking deposits.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={finish} disabled={finishing}>
                      {finishing ? "Finishing…" : "Go to dashboard"}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
