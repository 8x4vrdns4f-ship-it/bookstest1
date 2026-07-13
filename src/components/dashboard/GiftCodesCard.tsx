import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import SectionCard from "@/components/app/SectionCard";
import EmptyState from "@/components/app/EmptyState";
import { handleTierError } from "@/lib/tierError";

type GiftCodeRow = {
  id: string;
  code: string;
  tier: string;
  note: string | null;
  redeemed_at: string | null;
  redeemed_by: string | null;
  created_at: string;
};

const GiftCodesCard = () => {
  const [codes, setCodes] = useState<GiftCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tier, setTier] = useState<"silver" | "gold" | "platinum">("gold");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await (supabase as any)
      .from("gift_codes")
      .select("id, code, tier, note, redeemed_at, redeemed_by, created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    setCodes((data || []) as GiftCodeRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: codeData, error: genErr } = await (supabase as any).rpc("generate_gift_code");
      if (genErr) throw genErr;
      const code = codeData as string;

      const { error: insErr } = await (supabase as any).from("gift_codes").insert({
        code,
        tier,
        note: note.trim() || null,
        created_by: user.id,
      });
      if (insErr) throw insErr;

      try { await navigator.clipboard.writeText(code); } catch {}
      toast.success(`Code ${code} created & copied`, {
        description: "Share it — the recipient gets 30 days of the selected tier.",
      });
      setNote("");
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      if (!handleTierError(e)) {
        toast.error(e.message || "Could not create code");
      }
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  return (
    <SectionCard
      className="mb-8"
      icon={<Gift size={18} />}
      title="Gift Codes"
      description="Give someone 30 days of full access."
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="premium" className="gap-2">
              <Plus size={16} /> Generate code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Generate a gift code</DialogTitle>
              <DialogDescription>
                Requires an active plan. You can create up to 5 codes per month. Each unlocks 30 days of the selected tier.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Tier</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as any)}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <Textarea
                  placeholder="Who is this for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-background"
                  maxLength={200}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating} variant="premium">
                {creating ? "Creating…" : "Create code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : codes.length === 0 ? (
        <EmptyState
          icon={<Gift size={20} />}
          title="No gift codes yet"
          description="Generate one to give someone 30 days of full BookSuite access."
        />
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/40 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <code className="font-mono text-sm text-foreground">{c.code}</code>
                <Badge variant="outline" className="capitalize">{c.tier}</Badge>
                {c.redeemed_at ? (
                  <Badge className="bg-muted text-muted-foreground">Redeemed</Badge>
                ) : (
                  <Badge className="bg-primary/20 text-primary">Active</Badge>
                )}
                {c.note && <span className="text-xs text-muted-foreground truncate">{c.note}</span>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => copyCode(c.code)} className="gap-1">
                <Copy size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default GiftCodesCard;
