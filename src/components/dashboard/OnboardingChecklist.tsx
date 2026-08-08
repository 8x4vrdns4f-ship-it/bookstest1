import { publicOrigin } from "@/lib/publicUrl";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Rocket, Copy, Check, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getConnectAuthHeaders, getStripeEnvironment } from "@/lib/connectPayments";
import SectionCard from "@/components/app/SectionCard";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { userId: string };

type Step = {
  key: string;
  label: string;
  hint?: string;
  done: boolean;
  action?: { label: string; to?: string; onClick?: () => void };
};

/** Session-scoped hide, so the guide returns next visit until setup is complete. */
const HIDE_KEY = "booksuite:onboarding:hidden";
/** Permanent opt-out, only offered once setup is essentially done. */
const DONE_KEY = "booksuite:onboarding:dismissed";
const CELEBRATED_KEY = "booksuite:onboarding:celebrated";

const OnboardingChecklist = ({ userId }: Props) => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(HIDE_KEY) === "1" || localStorage.getItem(DONE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const bookingUrl = `${publicOrigin()}/book/${userId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const emailVerified = !!session?.user?.email_confirmed_at || !!(session?.user as any)?.confirmed_at;

      const [empRes, bookingRes, settingsRes] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase
          .from("business_settings")
          .select("business_name, working_hours, onboarding_completed_at")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      const settings = settingsRes.data as
        | { business_name: string | null; working_hours: any; onboarding_completed_at: string | null }
        | null;

      const hours = settings?.working_hours as Record<string, { closed?: boolean }> | null | undefined;
      const hoursSet = !!hours && Object.values(hours).some((d) => d && d.closed === false);
      const hasBookings = (bookingRes.count || 0) > 0;

      let stripeConnected = false;
      try {
        const headers = await getConnectAuthHeaders();
        const { data } = await supabase.functions.invoke("connect-account-status", {
          body: { environment: getStripeEnvironment() },
          headers,
        });
        stripeConnected = !!(data as any)?.charges_enabled;
      } catch { /* ignore */ }

      if (cancelled) return;

      const next: Step[] = [
        {
          key: "verify",
          label: "Verify your email",
          hint: "Needed so booking confirmations reach your customers.",
          done: emailVerified,
          action: emailVerified ? undefined : { label: "Verify", to: "/verify-email" },
        },
        {
          key: "business",
          label: "Add your business details",
          hint: "Your name and contact info appear on your booking page.",
          done: !!settings?.business_name,
          action: settings?.business_name ? undefined : { label: "Add details", to: "/settings" },
        },
        {
          key: "hours",
          label: "Set your opening hours",
          hint: "Customers can only book inside the hours you open.",
          done: hoursSet,
          action: hoursSet ? undefined : { label: "Set hours", to: "/settings" },
        },
        {
          key: "share",
          label: "Share your booking link",
          hint: bookingUrl,
          done: hasBookings,
          action: { label: copied ? "Copied" : "Copy link", onClick: copyLink },
        },
        {
          key: "employee",
          label: "Add your first team member",
          hint: "Optional if you work solo — you can do this any time.",
          done: (empRes.count || 0) > 0,
          action: { label: "Add staff", to: "/dashboard/staff" },
        },
        {
          key: "stripe",
          label: "Connect Stripe to take deposits",
          hint: "Reduce no-shows by charging a deposit at booking.",
          done: stripeConnected,
          action: stripeConnected ? undefined : { label: "Connect", to: "/payments" },
        },
        {
          key: "booking",
          label: "Receive your first booking",
          hint: "This ticks itself as soon as someone books.",
          done: hasBookings,
        },
      ];

      setSteps(next);
      setLoading(false);

      const allDone = next.every((s) => s.done);
      if (allDone) {
        try {
          if (localStorage.getItem(CELEBRATED_KEY) !== "1") {
            localStorage.setItem(CELEBRATED_KEY, "1");
            setCelebrate(true);
          }
        } catch {
          /* storage unavailable */
        }
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (hidden) return null;

  if (loading) {
    return (
      <SectionCard className="mb-8" icon={<Rocket size={18} />} title="Get set up">
        <div className="space-y-3">
          <Skeleton className="h-1.5 w-full rounded-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
      </SectionCard>
    );
  }

  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  const allDone = total > 0 && done === total;

  const hideForNow = () => {
    try { sessionStorage.setItem(HIDE_KEY, "1"); } catch { /* noop */ }
    setHidden(true);
  };

  const dismissForever = () => {
    try { localStorage.setItem(DONE_KEY, "1"); } catch { /* noop */ }
    setHidden(true);
  };

  if (allDone) {
    if (!celebrate) return null;
    return (
      <SectionCard
        className="mb-8"
        tone="success"
        icon={<PartyPopper size={18} />}
        title="You're fully set up"
        description="Everything's configured — your booking page is live and taking bookings."
        actions={
          <Button variant="ghost" size="icon" onClick={dismissForever} aria-label="Dismiss">
            <X size={16} />
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate("/dashboard/bookings")}>View bookings</Button>
          <Button size="sm" variant="outline" onClick={dismissForever}>Got it</Button>
        </div>
      </SectionCard>
    );
  }

  const nearlyDone = done >= total - 1;

  return (
    <SectionCard
      className="mb-8"
      icon={<Rocket size={18} />}
      title="Get set up"
      description={`${done} of ${total} steps complete`}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={nearlyDone ? dismissForever : hideForNow}
          className="text-xs text-muted-foreground"
        >
          {nearlyDone ? "Don't show again" : "Hide for now"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <ul className="space-y-1">
          {steps.map((s, i) => (
            <li
              key={s.key}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-[13px] min-w-0">
                {s.done ? (
                  <div className="w-6 h-6 rounded-full bg-success/15 text-success grid place-items-center shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground grid place-items-center text-[11px] font-semibold shrink-0">
                    {i + 1}
                  </div>
                )}
                <div className="min-w-0">
                  <span className={s.done ? "line-through text-muted-foreground truncate" : "text-foreground"}>
                    {s.label}
                  </span>
                  {!s.done && s.hint && (
                    <p className="text-[11px] text-muted-foreground truncate">{s.hint}</p>
                  )}
                </div>
              </div>
              {!s.done && s.action?.to && (
                <Button asChild size="sm" variant="outline" className="h-8 text-xs shrink-0">
                  <Link to={s.action.to}>{s.action.label}</Link>
                </Button>
              )}
              {!s.done && !s.action?.to && s.action?.onClick && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0 gap-1.5"
                  onClick={s.action.onClick}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {s.action.label}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
};

export default OnboardingChecklist;
