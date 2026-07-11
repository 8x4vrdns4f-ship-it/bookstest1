import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center py-12 px-6 rounded-[16px] border border-dashed border-border/70 bg-muted/10",
        className,
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-full bg-primary/[0.08] text-primary inline-flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-[13px] text-muted-foreground mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
