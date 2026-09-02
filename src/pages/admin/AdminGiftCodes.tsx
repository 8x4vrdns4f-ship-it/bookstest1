import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Plus, RefreshCw } from "lucide-react";

type GiftCode = {
  id: string;
  code: string;
  tier: string;
  created_by: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  note: string | null;
  created_at: string;
};

const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `BS-${out.slice(0, 4)}-${out.slice(4)}`;
};
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminGiftCodes() {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState("gold");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<GiftCode | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("gift_codes").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Could not load gift codes", description: error.message, variant: "destructive" });
    else setCodes((data as GiftCode[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      return;
    }
    const { error } = await supabase.from("gift_codes").insert({ code: randomCode(), tier, note: note.trim() || null, created_by: user.id });
    if (error) toast({ title: "Could not create code", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Gift code created", description: `${tier} code added.` });
      setNote("");
      await load();
    }
    setCreating(false);
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: "Code copied", description: code });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading gift codes…</p>;
  return (
    <div className="space-y-4">
      <SectionCard title="Create a gift code" description="Gift a subscription tier to someone — they redeem it at signup.">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="space-y-1.5"><Label htmlFor="admin-gift-tier">Tier</Label><Select value={tier} onValueChange={setTier}><SelectTrigger id="admin-gift-tier" className="w-40"><SelectValue placeholder="Tier" /></SelectTrigger><SelectContent><SelectItem value="silver">Silver</SelectItem><SelectItem value="gold">Gold</SelectItem><SelectItem value="platinum">Platinum</SelectItem></SelectContent></Select></div>
          <div className="flex-1 space-y-1.5"><Label htmlFor="admin-gift-note">Note (optional)</Label><Input id="admin-gift-note" placeholder="Who is it for?" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} /></div>
          <Button onClick={create} disabled={creating}><Plus className="h-4 w-4 mr-1.5" /> {creating ? "Creating…" : "Create code"}</Button>
        </div>
      </SectionCard>

      <div className="flex items-center justify-between gap-4"><p className="text-sm text-muted-foreground">Select any code to view its complete redemption record.</p><Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1.5" /> Refresh</Button></div>
      <SectionCard title={`All gift codes (${codes.length})`}>
        {codes.length === 0 ? <p className="text-sm text-muted-foreground">No gift codes yet.</p> : (
          <div className="divide-y divide-border">
            {codes.map((c) => (
              <button key={c.id} type="button" onClick={() => setSelected(c)} className="w-full flex items-center justify-between gap-4 py-3 text-left hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
                <div className="min-w-0"><p className="font-mono text-sm font-medium">{c.code}</p><p className="text-xs text-muted-foreground truncate">{c.note || "No note"} · created {fmtDate(c.created_at)}</p></div>
                <div className="flex items-center gap-2 shrink-0"><Badge variant="secondary" className="capitalize">{c.tier}</Badge><Badge variant={c.redeemed_at ? "default" : "secondary"}>{c.redeemed_at ? "Redeemed" : "Unused"}</Badge></div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && <>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Gift code details</DialogTitle><DialogDescription>Created {fmtDate(selected.created_at)}</DialogDescription></DialogHeader>
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4"><p className="font-mono text-lg font-semibold tracking-wide">{selected.code}</p><p className="text-sm text-muted-foreground">{selected.note || "No note attached"}</p></div>
            <div className="space-y-1"><p className="text-xs uppercase tracking-widest text-muted-foreground">Record</p><div className="rounded-xl border border-border p-4"><p className="text-sm flex justify-between gap-4"><span className="text-muted-foreground">Tier</span><span className="capitalize">{selected.tier}</span></p><p className="text-sm flex justify-between gap-4 mt-2"><span className="text-muted-foreground">Status</span><span>{selected.redeemed_at ? `Redeemed ${fmtDate(selected.redeemed_at)}` : "Unused"}</span></p><p className="text-sm flex justify-between gap-4 mt-2"><span className="text-muted-foreground">Redeemed by</span><span className="font-mono text-xs break-all">{selected.redeemed_by || "—"}</span></p><p className="text-sm flex justify-between gap-4 mt-2"><span className="text-muted-foreground">Created by</span><span className="font-mono text-xs break-all">{selected.created_by || "—"}</span></p></div></div>
            <DialogFooter><Button variant="outline" onClick={() => copy(selected.code)}><Copy className="h-4 w-4 mr-1.5" /> Copy code</Button></DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
