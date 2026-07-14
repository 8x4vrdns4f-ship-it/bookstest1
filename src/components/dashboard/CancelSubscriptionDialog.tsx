import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Gift, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const CancelSubscriptionDialog = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refresh, isActive, isGift, tier } = useSubscription();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"retain" | "confirm">(isGift ? "confirm" : "retain");
  const [busy, setBusy] = useState(false);

  if (!isActive) return null;

  const handleKeepWithDiscount = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-retention");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: "10% off applied 🎉",
        description: "Your discount is active forever on your current plan. Thanks for sticking with us!",
      });
      await refresh();
      setOpen(false);
      setStep("retain");
    } catch (e: any) {
      toast({ title: "Couldn't apply discount", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCancel = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: "Subscription canceled",
        description: "Your access has been removed. Check your email for a special offer to come back.",
      });
      await refresh();
      setOpen(false);
      setStep("retain");
      navigate("/pricing");
    } catch (e: any) {
      toast({ title: "Couldn't cancel", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep("retain"); }}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Cancel Subscription</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        {step === "retain" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Gift className="text-primary" size={20} />
                Wait — here's 10% off forever
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Before you cancel, we'd like to offer you <strong className="text-foreground">10% off
                your current plan, forever</strong>. One click and it's applied — no card details
                needed.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
              ✨ Keep all your bookings, settings, staff and clients exactly as they are — just at a
              lower price.
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep("confirm")}
                disabled={busy}
                className="text-muted-foreground hover:text-foreground"
              >
                No thanks, keep cancelling
              </Button>
              <Button onClick={handleKeepWithDiscount} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {busy ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                Claim 10% off forever
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle size={20} />
                Cancel your subscription?
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This is permanent. Cancelling will:
              </DialogDescription>
            </DialogHeader>
            <ul className="text-sm text-foreground space-y-2 list-disc pl-5">
              <li><strong>Immediately remove your access</strong> to BookSuite — no grace period.</li>
              <li>Stop billing on your card.</li>
              <li>Make you <strong>permanently ineligible</strong> for the 30-day free trial again.</li>
              <li>You can re-subscribe later, but it'll be at the regular price.</li>
            </ul>
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              We'll email you a one-time <strong className="text-foreground">20% off for 3 months</strong> code
              in case you change your mind.
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setStep("retain")} disabled={busy}>
                Go back
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel} disabled={busy}>
                {busy ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                Yes, cancel & remove access
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;
