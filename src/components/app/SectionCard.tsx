import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {

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
const SectionCard = forwardRef<HTMLDivElement, Props>(function SectionCard(
  {
    title,
    description,
    icon,
    actions,
    children,
    className,
    bodyClassName,
    tone = "default",
    ...rest
  },
  ref,
) {
  const hasHeader = title || description || icon || actions;
  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        "rounded-[20px] bg-card border",
        toneRing[tone],
        className,
      )}
    >

      {hasHeader && (
        <div className="flex items-start justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-3">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div
                className={cn(
                  "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl",
                  toneIconBg[tone],
                )}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-[15px] font-semibold text-foreground leading-tight tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children !== undefined && children !== null && children !== false && (
        <div className={cn("px-5 md:px-6 pb-5 md:pb-6", hasHeader ? "pt-2" : "pt-5 md:pt-6", bodyClassName)}>
          {children}
        </div>
      )}
    </div>
  );
});

export default SectionCard;

