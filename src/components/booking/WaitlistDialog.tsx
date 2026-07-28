import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";

interface Props {
  userId: string;
  businessName: string;
}

const WaitlistDialog = ({ userId, businessName }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", service: "",
    date: "", start: "", end: "", partySize: "", notes: "",
  });

  const submit = async () => {
    if (!form.name || !form.email || !form.date) {
      toast({ title: "Name, email and date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("join_waitlist", {
      p_user_id: userId,
      p_client_name: form.name,
      p_client_email: form.email,
      p_client_phone: form.phone || null,
      p_service: form.service || null,
      p_preferred_date: form.date,
      p_preferred_time_start: form.start || null,
      p_preferred_time_end: form.end || null,
      p_party_size: form.partySize ? Number(form.partySize) : null,
      p_notes: form.notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't join waitlist", description: error.message, variant: "destructive" });
      return;
    }

    // Fire-and-forget confirmation email (invoke without auth is fine — send-transactional-email is public).
    try {
      const timeWindow = form.start && form.end ? `${form.start}–${form.end}` : form.start || form.end || undefined;
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "waitlist-added",
          recipientEmail: form.email,
          idempotencyKey: `waitlist-added-${userId}-${form.email}-${form.date}`,
          templateData: {
            businessName,
            clientName: form.name,
            service: form.service || undefined,
            date: new Date(form.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
            timeWindow,
          },
        },
      });
    } catch { /* non-fatal */ }

    toast({ title: "You're on the waitlist", description: "We'll email you as soon as a slot opens." });
    setOpen(false);
    setForm({ name: "", email: "", phone: "", service: "", date: "", start: "", end: "", partySize: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Clock size={16} /> Join the waitlist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Join the waitlist</DialogTitle>
          <DialogDescription>
            Fully booked on your preferred day? Leave your details and we'll email you the moment a slot opens.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Preferred date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Party</Label>
              <Input type="number" min={1} value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Joining…" : "Join waitlist"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;
