import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";

type Role = {
  id: string;
  name: string;
  is_builtin: boolean;
  can_approve_requests: boolean;
  can_view_all_bookings: boolean;
  can_check_in: boolean;
  can_manage_settings: boolean;
};

type RoleForm = {
  name: string;
  can_approve_requests: boolean;
  can_view_all_bookings: boolean;
  can_check_in: boolean;
  can_manage_settings: boolean;
};

const empty: RoleForm = {
  name: "",
  can_approve_requests: false,
  can_view_all_bookings: false,
  can_check_in: false,
  can_manage_settings: false,
};

const RolesManager = ({ userId }: { userId: string }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("company_roles")
      .select("*")
      .eq("user_id", userId)
      .order("is_builtin", { ascending: false })
      .order("name");
    setRoles((data || []) as Role[]);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const startNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (r: Role) => {
    setEditing(r);
    setForm({
      name: r.name,
      can_approve_requests: r.can_approve_requests,
      can_view_all_bookings: r.can_view_all_bookings,
      can_check_in: r.can_check_in,
      can_manage_settings: r.can_manage_settings,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setBusy(true);
    if (editing) {
      const payload = editing.is_builtin
        ? {
            // built-ins: only permissions editable (name locked)
            can_approve_requests: form.can_approve_requests,
            can_view_all_bookings: form.can_view_all_bookings,
            can_check_in: form.can_check_in,
            can_manage_settings: form.can_manage_settings,
          }
        : { ...form };
      const { error } = await supabase.from("company_roles").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); setBusy(false); return; }
    } else {
      const { error } = await supabase.from("company_roles").insert({ ...form, user_id: userId, is_builtin: false });
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); setBusy(false); return; }
    }
    setBusy(false); setOpen(false); load();
    toast({ title: "Role saved" });
  };

  const remove = async (r: Role) => {
    if (r.is_builtin) return;
    if (!confirm(`Delete role "${r.name}"? Employees with this role will need to be reassigned.`)) return;
    const { error } = await supabase.from("company_roles").delete().eq("id", r.id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Role deleted" });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Built-in roles are locked but their permissions can be tweaked. Create custom roles for your business.</p>
        <Button size="sm" onClick={startNew} className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={14} /> New Role
        </Button>
      </div>

      <div className="space-y-2">
        {roles.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-secondary/40 border border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground capitalize">{r.name}</p>
                {r.is_builtin && (
                  <Badge variant="outline" className="gap-1 text-[10px]"><Lock size={10} /> built-in</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[
                  r.can_approve_requests && "approve requests",
                  r.can_view_all_bookings && "view bookings",
                  r.can_check_in && "check-in",
                  r.can_manage_settings && "manage settings",
                ].filter(Boolean).join(" · ") || "no permissions"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(r)}><Pencil size={14} /></Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive disabled:opacity-30"
                disabled={r.is_builtin}
                onClick={() => remove(r)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "New Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Role Name</Label>
              <Input
                value={form.name}
                disabled={editing?.is_builtin}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. supervisor"
                className="bg-secondary border-border"
              />
            </div>
            <PermRow label="Approve join requests" hint="Accept or decline employee join requests."
              checked={form.can_approve_requests} onChange={(v) => setForm({ ...form, can_approve_requests: v })} />
            <PermRow label="View all company bookings" hint="See every booking, not only their own."
              checked={form.can_view_all_bookings} onChange={(v) => setForm({ ...form, can_view_all_bookings: v })} />
            <PermRow label="Check-in customers" hint="Use the receptionist scanner and check-in tools."
              checked={form.can_check_in} onChange={(v) => setForm({ ...form, can_check_in: v })} />
            <PermRow label="Manage business settings" hint="Edit hours, branding, integrations."
              checked={form.can_manage_settings} onChange={(v) => setForm({ ...form, can_manage_settings: v })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {busy ? "Saving…" : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PermRow = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-3 p-2 rounded-md bg-secondary/40">
    <div>
      <p className="text-sm text-foreground font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default RolesManager;
