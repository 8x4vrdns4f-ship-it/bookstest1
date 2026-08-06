import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, type LucideIcon } from "lucide-react";

type Size = "sm" | "md" | "lg" | "xl";
type Tone = "default" | "destructive";

const sizeClass: Record<Size, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  size?: Size;
  tone?: Tone;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const AppDialog = React.forwardRef<HTMLDivElement, AppDialogProps>(function AppDialog(
  {
    open,
    onOpenChange,
    title,
    description,
    icon: Icon,
    size = "md",
    tone = "default",
    children,
    footer,
    className,
    contentClassName,
  },
  ref,
) {
  const isDestructive = tone === "destructive";
  const DisplayIcon = Icon ?? (isDestructive ? AlertTriangle : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} className={cn("rounded-[20px]", sizeClass[size], className)}>

        <DialogHeader>
          <div className="flex items-start gap-3">
            {DisplayIcon && (
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  isDestructive
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/[0.08] text-primary",
                )}
              >
                <DisplayIcon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[17px] font-semibold tracking-tight">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-[13px] leading-relaxed">{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        {children && <div className={cn("space-y-4", contentClassName)}>{children}</div>}
        {footer && <DialogFooter className="gap-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      tone={tone}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "destructive" ? "destructive" : "premium"}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    />
  );
}
