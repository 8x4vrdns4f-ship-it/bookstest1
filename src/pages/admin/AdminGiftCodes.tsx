import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

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

export default function AdminGiftCodes() {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState("gold");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data, error } = await supabase
      .from("gift_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load gift codes", description: error.message, variant: "destructive" });
    } else {
      setCodes((data as GiftCode[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("gift_codes").insert({
      code: randomCode(),
      tier,
      note: note.trim() || null,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Could not create code", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gift code created", description: `${tier} code added.` });
      setNote("");
      load();
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading gift codes…</p>;

  return (
    <div className="space-y-4">
      <SectionCard title="Create a gift code" description="Gift a subscription tier to someone — they redeem it at signup.">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="admin-gift-tier">Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger id="admin-gift-tier" className="w-40">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="admin-gift-note">Note (optional)</Label>
            <Input
              id="admin-gift-note"
              placeholder="Who is it for?"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button onClick={create}>
            <Plus className="h-4 w-4 mr-1.5" /> Create code
          </Button>
        </div>
      </SectionCard>

      <SectionCard title={`All gift codes (${codes.length})`}>
        {codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gift codes yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {codes.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium">{c.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.note || "No note"} · created{" "}
                    {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="capitalize">{c.tier}</Badge>
                  <Badge variant={c.redeemed_at ? "default" : "secondary"}>
                    {c.redeemed_at ? "Redeemed" : "Unused"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
