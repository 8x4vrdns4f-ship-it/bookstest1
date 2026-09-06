import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updatePortalDetails } from "@/lib/clientPortal";

interface Props {
  sessionToken: string;
  email: string;
  name: string | null;
  phone: string | null;
  onSaved: () => void;
}

const PortalDetailsDialog = ({ sessionToken, email, name, phone, onSaved }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(name ?? "");
  const [tel, setTel] = useState(phone ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updatePortalDetails(sessionToken, fullName, tel);
      toast({ title: "Details saved" });
      setOpen(false);
      onSaved();
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserCog className="h-3.5 w-3.5" />
          My details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Your details</DialogTitle>
          <DialogDescription>Used to prefill your next booking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="portal-name">Name</Label>
            <Input id="portal-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="portal-phone">Phone</Label>
            <Input id="portal-phone" value={tel} onChange={(e) => setTel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <Button className="w-full" onClick={save} disabled={saving || !fullName.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PortalDetailsDialog;
