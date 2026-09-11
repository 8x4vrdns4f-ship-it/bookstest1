import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const DeleteAccountDialog = () => {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirm: confirm.trim().toUpperCase() },
      });
      const errMessage = error?.message || (data as { error?: string } | null)?.error;
      if (errMessage) throw new Error(errMessage);

      toast({ title: "Account deleted", description: "Your account and data have been removed." });
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      toast({
        title: "Could not delete account",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirm(""); }}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete your account</DialogTitle>
          <DialogDescription>
            This permanently deletes your business, bookings, clients, staff and settings. Any active
            subscription is cancelled. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
          <Input
            id="confirm-delete"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="bg-secondary border-border"
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Keep my account</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={busy || confirm.trim().toUpperCase() !== "DELETE"}
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
