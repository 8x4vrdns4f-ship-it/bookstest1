import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, X, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getConnectAuthHeaders, getStripeEnvironment } from "@/lib/connectPayments";
import SectionCard from "@/components/app/SectionCard";

type Props = { userId: string };

type Step = { key: string; label: string; done: boolean; action?: { label: string; to?: string; onClick?: () => void } };

const STORAGE_KEY = "booksuite:onboarding:dismissed";

const OnboardingChecklist = ({ userId }: Props) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const emailVerified = !!session?.user?.email_confirmed_at || !!(session?.user as any)?.confirmed_at;

      const [empRes, bookingRes] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

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
      setSteps([
        { key: "verify", label: "Verify your email", done: emailVerified, action: emailVerified ? undefined : { label: "Resend", to: "/verify-email" } },
        { key: "stripe", label: "Connect Stripe to collect deposits", done: stripeConnected, action: stripeConnected ? undefined : { label: "Connect", to: "/dashboard" } },
        { key: "employee", label: "Add your first team member", done: (empRes.count || 0) > 0 },
        { key: "booking", label: "Receive your first booking", done: (bookingRes.count || 0) > 0 },
      ]);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [userId]);

  if (dismissed || loading) return null;
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  if (total > 0 && done === total) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
    setDismissed(true);
  };

  return (
    <SectionCard
      className="mb-8"
      icon={<Rocket size={18} />}
      title={`Get set up`}
      description={`${done} of ${total} steps complete`}
      actions={
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss checklist">
          <X size={16} />
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-[image:var(--gradient-primary)] transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <ul className="space-y-2">
          {steps.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-sm">
                {s.done ? (
                  <CheckCircle2 size={18} className="text-success" />
                ) : (
                  <Circle size={18} className="text-muted-foreground" />
                )}
                <span className={s.done ? "line-through text-muted-foreground" : "text-foreground"}>
                  {s.label}
                </span>
              </div>
              {!s.done && s.action?.to && (
                <Button asChild size="sm" variant="outline">
                  <Link to={s.action.to}>{s.action.label}</Link>
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
