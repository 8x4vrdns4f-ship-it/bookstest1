import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Mail, Phone, Users } from "lucide-react";
import SectionCard from "@/components/app/SectionCard";
import EmptyState from "@/components/app/EmptyState";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

const ClientList = ({ userId }: { userId: string }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("name");
    if (data) setClients(data);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("clients").insert({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
      user_id: userId,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Client added!" });
      setOpen(false);
      setForm({ name: "", email: "", phone: "", notes: "" });
      fetchClients();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    fetchClients();
  };

  return (
    <SectionCard
      icon={<Users size={18} />}
      title="Clients"
      description="Your customer contact list."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="premium" className="gap-1">
              <Plus size={14} /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-border" rows={2} />
              </div>
              <Button type="submit" disabled={loading} variant="premium" className="w-full">
                {loading ? "Adding..." : "Add Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {clients.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title="No clients yet"
          description="Add clients manually or they'll appear here automatically when they book."
        />
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/40 border border-border hover:border-primary/30 transition-colors">
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">{c.name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {c.email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail size={10} /> {c.email}
                    </span>
                  )}
                  {c.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone size={10} /> {c.phone}
                    </span>
                  )}
                </div>
                {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(c.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default ClientList;
