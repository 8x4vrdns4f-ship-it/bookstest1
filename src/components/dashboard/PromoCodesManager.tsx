import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, TicketPercent } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  active: boolean;
}

interface Props {
  userId: string;
  maxCodes: number;
}

const PromoCodesManager = ({ userId, maxCodes }: Props) => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCodes((data as unknown as PromoCode[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const resetForm = () => {
    setCode(""); setDiscountType("percent"); setDiscountValue("10");
    setMaxUses(""); setExpiresAt("");
  };

  const create = async () => {
    const value = Number(discountValue);
    const normalized = code.trim().toUpperCase();
    if (!normalized || normalized.length < 3 || normalized.length > 32) {
      toast({ title: "Code must be 3–32 characters", variant: "destructive" }); return;
    }
    if (!/^[A-Z0-9-]+$/.test(normalized)) {
      toast({ title: "Code can only use letters, numbers and dashes", variant: "destructive" }); return;
    }
    if (!(value > 0) || (discountType === "percent" && value > 100)) {
      toast({ title: discountType === "percent" ? "Enter 1–100%" : "Enter an amount above 0", variant: "destructive" }); return;
    }
    const mu = maxUses.trim() ? Math.floor(Number(maxUses)) : null;
    if (mu !== null && (!(mu > 0) || mu > 100000)) {
      toast({ title: "Usage limit must be a positive number", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("promo_codes").insert({
      user_id: userId,
      code: normalized,
      discount_type: discountType,
      discount_value: value,
      max_uses: mu,
      expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
    } as never);
    setSaving(false);
    if (error) {
      const msg = error.message.includes("TIER_LIMIT_PROMO_CODES")
        ? `Your plan allows ${maxCodes} promo code${maxCodes === 1 ? "" : "s"}. Upgrade for more.`
        : error.message.includes("duplicate") ? "That code already exists" : error.message;
      toast({
        title: "Could not create code",
        description: msg,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Promo code created" });
    setOpen(false);
    resetForm();
    load();
  };

  const toggleActive = async (pc: PromoCode) => {
    const { error } = await supabase
      .from("promo_codes")
      .update({ active: !pc.active } as never)
      .eq("id", pc.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else load();
  };

  const isExpired = (pc: PromoCode) => pc.expires_at && new Date(pc.expires_at) < new Date();
  const isUsedUp = (pc: PromoCode) => pc.max_uses != null && pc.times_used >= pc.max_uses;

  const atCap = codes.length >= maxCodes;

  return (
    <div className="space-y-3 pb-5">
      <p className="text-xs text-muted-foreground">
        {codes.length} of {maxCodes} promo code{maxCodes === 1 ? "" : "s"} used on your plan.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No promo codes yet. Create one and share it with your clients — they enter it when booking.
        </p>
      ) : (
        <div className="space-y-2">
          {codes.map((pc) => (
            <div key={pc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-foreground">{pc.code}</span>
                  <Badge variant={pc.active && !isExpired(pc) && !isUsedUp(pc) ? "default" : "secondary"}>
                    {isExpired(pc) ? "Expired" : isUsedUp(pc) ? "Used up" : pc.active ? "Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pc.discount_type === "percent" ? `${pc.discount_value}% off` : `£${pc.discount_value} off`}
                  {" · "}used {pc.times_used}{pc.max_uses != null ? `/${pc.max_uses}` : ""} times
                  {pc.expires_at ? ` · ends ${new Date(pc.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <Switch checked={pc.active} onCheckedChange={() => toggleActive(pc)} aria-label={`Toggle ${pc.code}`} />
            </div>
          ))}
        </div>
      )}
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={atCap}>
        <Plus size={14} className="mr-1.5" /> New promo code
      </Button>
      {atCap && (
        <p className="text-xs text-muted-foreground">
          You've reached your plan's promo code limit. Pause a code to stop it, or{" "}
          <a href="/pricing" className="text-primary underline underline-offset-2">upgrade</a> for more.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TicketPercent size={18} /> New promo code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="pc-code">Code</Label>
              <Input
                id="pc-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="font-mono uppercase mt-1.5"
                maxLength={32}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount type</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "fixed")}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pc-value">{discountType === "percent" ? "Percent off" : "Amount off (£)"}</Label>
                <Input
                  id="pc-value" type="number" min={1} max={discountType === "percent" ? 100 : undefined}
                  value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pc-uses">Usage limit (optional)</Label>
                <Input
                  id="pc-uses" type="number" min={1} value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="pc-expires">Expiry date (optional)</Label>
                <Input
                  id="pc-expires" type="date" value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)} className="mt-1.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? "Creating…" : "Create code"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesManager;
