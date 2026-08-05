import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/app/EmptyState";
import ListSkeleton from "@/components/app/ListSkeleton";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  active: boolean;
  sort_order: number;
};

export default function ServicesManager({ userId, currency = "GBP" }: { userId: string; currency?: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDur, setNewDur] = useState<number>(30);
  const [newPrice, setNewPrice] = useState<string>("");

  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price, active, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast({ title: "Failed to load services", description: error.message, variant: "destructive" });
    setItems((data as Service[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const add = async () => {
    if (!newName.trim()) return;
    const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const parsedPrice = newPrice.trim() === "" ? null : Number(newPrice);
    const { error } = await supabase.from("services").insert({
      user_id: userId,
      name: newName.trim(),
      duration_minutes: Math.max(5, Math.floor(newDur || 30)),
      price: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
      sort_order: nextOrder,
    });
    if (error) { toast({ title: "Add failed", description: error.message, variant: "destructive" }); return; }
    setNewName(""); setNewDur(30); setNewPrice("");
    load();
  };

  const update = async (id: string, patch: Partial<Service>) => {
    setItems((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } as Service : s)));
    const { error } = await supabase.from("services").update(patch).eq("id", id);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    setItems((cur) => cur.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Add everything a customer can book. Each service sets its own length, so the widget works out availability for you.
      </p>

      {loading ? (
        <ListSkeleton rows={2} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={20} />}
          title="No services yet"
          description="Add your first service below so customers can pick what they're booking."
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border">
              <Input
                value={s.name}
                onChange={(e) => setItems((cur) => cur.map((i) => (i.id === s.id ? { ...i, name: e.target.value } : i)))}
                onBlur={(e) => update(s.id, { name: e.target.value.trim() || s.name })}
                className="bg-background border-border flex-1 min-w-[140px]"
                placeholder="Service name"
              />
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number" min={5} max={600} step={5}
                  value={s.duration_minutes}
                  onChange={(e) => setItems((cur) => cur.map((i) => (i.id === s.id ? { ...i, duration_minutes: Number(e.target.value) } : i)))}
                  onBlur={(e) => update(s.id, { duration_minutes: Math.max(5, Math.floor(Number(e.target.value) || 30)) })}
                  className="bg-background border-border w-20"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">{symbol || "Price"}</Label>
                <Input
                  type="number" min={0} step="0.01"
                  value={s.price ?? ""}
                  placeholder="—"
                  onChange={(e) => setItems((cur) => cur.map((i) => (i.id === s.id ? { ...i, price: e.target.value === "" ? null : Number(e.target.value) } : i)))}
                  onBlur={(e) => update(s.id, { price: e.target.value === "" ? null : Number(e.target.value) })}
                  className="bg-background border-border w-24"
                />
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={s.active} onCheckedChange={(v) => update(s.id, { active: v })} />
                <Label className="text-xs text-muted-foreground">{s.active ? "Active" : "Off"}</Label>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)} className="text-destructive hover:text-destructive">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 p-3 rounded-md bg-secondary/40 border border-border border-dashed">
        <div className="flex-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">New service name</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Skin fade" className="bg-background border-border mt-1" />
        </div>
        <div className="w-24">
          <Label className="text-xs text-muted-foreground">Minutes</Label>
          <Input type="number" min={5} step={5} value={newDur} onChange={(e) => setNewDur(Number(e.target.value))} className="bg-background border-border mt-1" />
        </div>
        <div className="w-24">
          <Label className="text-xs text-muted-foreground">Price {symbol}</Label>
          <Input type="number" min={0} step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Optional" className="bg-background border-border mt-1" />
        </div>
        <Button onClick={add} disabled={!newName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}
