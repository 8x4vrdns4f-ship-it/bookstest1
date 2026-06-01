import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleTierError } from "@/lib/tierError";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface AddEmployeeDialogProps {
  userId: string;
  onEmployeeAdded?: () => void;
}

const AddEmployeeDialog = ({ userId, onEmployeeAdded }: AddEmployeeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("employees").insert({
      user_id: userId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      position: position.trim() || null,
    });
    setLoading(false);
    if (error) {
      if (!handleTierError(error)) toast({ title: "Error", description: "Failed to add employee.", variant: "destructive" });
      return;
    }

    toast({
      title: "Employee added!",
      description: `${name} can now join with your company code (Settings → Company Info). Email invites coming soon.`,
    });
    setName("");
    setEmail("");
    setPhone("");
    setPosition("");
    setOpen(false);
    onEmployeeAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm">
          <UserPlus size={16} />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Team Member</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add an employee to your team so they can help manage bookings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@company.com" className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Phone</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Position / Role</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Stylist, Receptionist" className="bg-secondary border-border" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            {loading ? "Adding..." : "Add Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
