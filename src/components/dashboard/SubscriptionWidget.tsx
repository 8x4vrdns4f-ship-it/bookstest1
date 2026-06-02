import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

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
      <Card className="bg-card border-destructive/40 mb-6">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">No active subscription</p>
              <p className="text-xs text-muted-foreground">Pick a plan to start using BookSuite.</p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/pricing">View plans</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const trialDays = daysUntil(trialEnd);
  const renewalDays = daysUntil(currentPeriodEnd);
  const onTrial = isTrialing && trialDays !== null;
  const days = onTrial ? trialDays : renewalDays;
  const label = onTrial ? "Free trial ends in" : "Renews in";
  const warn = days !== null && days <= 7;

  return (
    <Card className={`mb-6 bg-card ${warn ? "border-primary/50" : "border-border"}`}>
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
            {onTrial ? <Sparkles size={16} /> : <Clock size={16} />}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">
              {tier} plan {onTrial && <span className="text-primary">(free trial)</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {label} <span className="text-foreground font-medium">{days ?? "—"} day{days === 1 ? "" : "s"}</span>
              {onTrial && " — card will be charged automatically"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/pricing">Change plan</Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="text-muted-foreground">
            <Link to="/settings">Manage</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionWidget;
