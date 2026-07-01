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
        "flex flex-col items-center text-center py-10 px-6 rounded-xl border border-dashed border-border bg-muted/20",
        className,
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
