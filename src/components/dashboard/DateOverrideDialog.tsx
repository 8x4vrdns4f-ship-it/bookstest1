import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppDialog } from "@/components/app/AppDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date | null;
  userId: string;
  onSaved?: () => void;
};

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const DateOverrideDialog = ({ open, onOpenChange, date, userId, onSaved }: Props) => {
  const [closed, setClosed] = useState(false);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [loading, setLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !date) return;
    const dateStr = fmt(date);
    supabase
      .from("date_overrides")
      .select("*")
      .eq("user_id", userId)
      .eq("override_date", dateStr)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setClosed(data.closed);
          setOpenTime(data.open_time?.slice(0, 5) || "09:00");
          setCloseTime(data.close_time?.slice(0, 5) || "18:00");
        } else {
          setExistingId(null);
          setClosed(false);
          setOpenTime("09:00");
          setCloseTime("18:00");
        }
      });
  }, [open, date, userId]);

  if (!date) return null;
  const dateStr = fmt(date);

  const save = async () => {
    setLoading(true);
    const payload = {
      user_id: userId,
      override_date: dateStr,
      closed,
      open_time: closed ? null : openTime,
      close_time: closed ? null : closeTime,
    };
    const { error } = await supabase.from("date_overrides").upsert(payload, { onConflict: "user_id,override_date" });
    setLoading(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Hours updated", description: `${dateStr}` });
    onSaved?.();
    onOpenChange(false);
  };

  const remove = async () => {
    if (!existingId) { onOpenChange(false); return; }
    setLoading(true);
    const { error } = await supabase.from("date_overrides").delete().eq("id", existingId);
    setLoading(false);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Override removed", description: "Default weekly hours apply again." });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Hours for {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            One-off override for this date only. Your weekly defaults stay the same.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
          <Label className="text-foreground">Closed this day</Label>
          <Switch checked={closed} onCheckedChange={setClosed} />
        </div>

        {!closed && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Open</Label>
              <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Close</Label>
              <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {existingId && (
            <Button variant="outline" onClick={remove} disabled={loading} className="border-border text-muted-foreground">
              Remove override
            </Button>
          )}
          <Button onClick={save} disabled={loading} className="flex-1 bg-primary text-primary-foreground">
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateOverrideDialog;
