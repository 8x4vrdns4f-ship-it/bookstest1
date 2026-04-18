import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Settings = {
  deposit_amount: number;
  day_start_hour: number;
  day_end_hour: number;
  business_name: string;
};

const BusinessSettingsDialog = ({ userId }: { userId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState<Settings>({
    deposit_amount: 10,
    day_start_hour: 9,
    day_end_hour: 18,
    business_name: "",
  });

  useEffect(() => {
    if (!open) return;
    supabase
      .from("business_settings")
      .select("deposit_amount, day_start_hour, day_end_hour, business_name")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            deposit_amount: Number(data.deposit_amount),
            day_start_hour: data.day_start_hour,
            day_end_hour: data.day_end_hour,
            business_name: data.business_name || "",
          });
        }
      });
  }, [open, userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.deposit_amount < 10) {
      toast({ title: "Deposit must be at least £10", variant: "destructive" });
      return;
    }
    if (form.day_end_hour <= form.day_start_hour) {
      toast({ title: "End hour must be after start hour", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("business_settings")
      .upsert({ user_id: userId, ...form }, { onConflict: "user_id" });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
          <Settings size={16} />
          Business Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Business Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <Label>Business name (shown on widget)</Label>
            <Input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="bg-secondary border-border"
              placeholder="e.g. Jay's Barbers"
            />
          </div>
          <div className="space-y-1">
            <Label>Deposit per booking (£) — min £10</Label>
            <Input
              type="number"
              min={10}
              step="0.50"
              value={form.deposit_amount}
              onChange={(e) => setForm({ ...form, deposit_amount: Number(e.target.value) })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Day start (24h)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={form.day_start_hour}
                onChange={(e) => setForm({ ...form, day_start_hour: Number(e.target.value) })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1">
              <Label>Day end (24h)</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={form.day_end_hour}
                onChange={(e) => setForm({ ...form, day_end_hour: Number(e.target.value) })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessSettingsDialog;
