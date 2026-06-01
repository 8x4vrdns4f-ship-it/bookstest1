import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TIER_LIMITS, type Tier } from "@/lib/tierLimits";

interface LockedFeatureProps {
  requiredTier: Tier;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const LockedFeature = ({ requiredTier, title, description, children }: LockedFeatureProps) => {
  const tierName = TIER_LIMITS[requiredTier].name;
  return (
    <div className="relative">
      {children && (
        <div className="pointer-events-none select-none blur-sm opacity-40">{children}</div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg p-6 text-center max-w-sm shadow-lg">
          <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
            <Lock size={18} className="text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {description ?? `Upgrade to ${tierName} to unlock this feature.`}
          </p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/pricing">Upgrade to {tierName}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LockedFeature;
