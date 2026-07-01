import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import SectionCard from "@/components/app/SectionCard";

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const SubscriptionWidget = () => {
  const { tier, isActive, isTrialing, trialEnd, currentPeriodEnd, loading } = useSubscription();

  if (loading) return null;
  if (!isActive) {
    return (
      <SectionCard
        className="mb-6"
        tone="danger"
        icon={<AlertCircle size={18} />}
        title="No active subscription"
        description="Pick a plan to start using BookSuite."
        actions={
          <Button asChild size="sm" variant="premium">
            <Link to="/pricing">View plans</Link>
          </Button>
        }
      >
  
      </SectionCard>
    );
  }

  const trialDays = daysUntil(trialEnd);
  const renewalDays = daysUntil(currentPeriodEnd);
  const onTrial = isTrialing && trialDays !== null;
  const days = onTrial ? trialDays : renewalDays;
  const label = onTrial ? "Free trial ends in" : "Renews in";
  const warn = days !== null && days <= 7;

  return (
    <SectionCard
      className="mb-6"
      tone={warn ? "warning" : "default"}
      icon={onTrial ? <Sparkles size={18} /> : <Clock size={18} />}
      title={
        <span className="capitalize">
          {tier} plan{" "}
          {onTrial && <span className="text-primary font-semibold">(free trial)</span>}
        </span>
      }
      description={
        <>
          {label}{" "}
          <span className="text-foreground font-medium">
            {days ?? "—"} day{days === 1 ? "" : "s"}
          </span>
          {onTrial && " — card will be charged automatically"}
        </>
      }
      actions={
        <>
          <Button asChild size="sm" variant="outline">
            <Link to="/pricing">Change plan</Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="text-muted-foreground">
            <Link to="/settings">Manage</Link>
          </Button>
        </>
      }
    >

    </SectionCard>
  );
};

export default SubscriptionWidget;
