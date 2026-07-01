import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: "default" | "warning" | "danger" | "success";
};

const toneRing: Record<NonNullable<Props["tone"]>, string> = {
  default: "border-border",
  warning: "border-warning/40",
  danger: "border-destructive/40",
  success: "border-success/40",
};

const toneIconBg: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

/**
 * Unified card shell for dashboard surfaces.
 * - 2xl radius, tokenised border and elevation
 * - Optional icon chip, title, description, and action slot in header
 * - Consistent padding across variants
 */
export default function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  className,
  bodyClassName,
  tone = "default",
}: Props) {
  const hasHeader = title || description || icon || actions;
  return (
    <div
      className={cn(
        "rounded-2xl bg-card border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow",
        toneRing[tone],
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 p-5 md:p-6 pb-3">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div
                className={cn(
                  "shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl",
                  toneIconBg[tone],
                )}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-foreground leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1 leading-snug">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5 md:p-6", hasHeader && "pt-2", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
