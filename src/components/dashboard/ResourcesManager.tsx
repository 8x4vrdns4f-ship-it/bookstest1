import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Resource = {
  id: string;
  name: string;
  capacity: number;
  active: boolean;
  sort_order: number;
};

export default function ResourcesManager({ userId, label }: { userId: string; label: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCap, setNewCap] = useState<number>(1);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .select("id, name, capacity, active, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast({ title: "Failed to load resources", description: error.message, variant: "destructive" });
    setItems((data as Resource[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const add = async () => {
    if (!newName.trim()) return;
    const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const { error } = await supabase.from("resources").insert({
      user_id: userId,
      name: newName.trim(),
      capacity: Math.max(1, Math.floor(newCap || 1)),
      sort_order: nextOrder,
    });
    if (error) { toast({ title: "Add failed", description: error.message, variant: "destructive" }); return; }
    setNewName(""); setNewCap(1);
    load();
  };

  const update = async (id: string, patch: Partial<Resource>) => {
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } as Resource : r)));
    const { error } = await supabase.from("resources").update(patch).eq("id", id);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    setItems((cur) => cur.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Add each bookable {label.toLowerCase()} clients can choose. Capacity is the maximum party size that {label.toLowerCase()} can host.
      </p>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground p-3 rounded-md bg-secondary/40 border border-border">
          No {label.toLowerCase()}s yet. Add your first below.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border">
              <Input
                value={r.name}
                onChange={(e) => setItems((cur) => cur.map((i) => (i.id === r.id ? { ...i, name: e.target.value } : i)))}
                onBlur={(e) => update(r.id, { name: e.target.value.trim() || r.name })}
                className="bg-background border-border flex-1"
                placeholder={`${label} name`}
              />
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Seats</Label>
                <Input
                  type="number" min={1} max={999}
                  value={r.capacity}
                  onChange={(e) => setItems((cur) => cur.map((i) => (i.id === r.id ? { ...i, capacity: Number(e.target.value) } : i)))}
                  onBlur={(e) => update(r.id, { capacity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                  className="bg-background border-border w-20"
                />
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={r.active} onCheckedChange={(v) => update(r.id, { active: v })} />
                <Label className="text-xs text-muted-foreground">{r.active ? "Active" : "Off"}</Label>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-destructive hover:text-destructive">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-3 rounded-md bg-secondary/40 border border-border border-dashed">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">New {label.toLowerCase()} name</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`e.g. ${label} 1`} className="bg-background border-border mt-1" />
        </div>
        <div className="w-24">
          <Label className="text-xs text-muted-foreground">Seats</Label>
          <Input type="number" min={1} value={newCap} onChange={(e) => setNewCap(Number(e.target.value))} className="bg-background border-border mt-1" />
        </div>
        <Button onClick={add} disabled={!newName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}
