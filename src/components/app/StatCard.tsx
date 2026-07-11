import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  trend?: { value: string; positive?: boolean };
  onClick?: () => void;
  className?: string;
};

export default function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  onClick,
  className,
}: Props) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "text-left w-full rounded-[20px] bg-card border border-border p-5",
        "transition-colors hover:border-primary/40",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="stat-label">{label}</span>
        {icon && (
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/[0.08] text-primary">
            {icon}
          </span>
        )}
      </div>
      <div className="stat-value mt-4">{value}</div>
      {(hint || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-[12px]">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md",
                trend.positive
                  ? "text-success bg-success/10"
                  : "text-destructive bg-destructive/10",
              )}
            >
              {trend.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Comp>
  );
}
