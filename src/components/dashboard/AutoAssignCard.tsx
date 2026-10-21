import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Mode = "off" | "resource" | "service";
type Emp = { id: string; name: string };

export default function AutoAssignCard({ userId, resourceLabel }: { userId: string; resourceLabel: string }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("off");
  const [emps, setEmps] = useState<Emp[]>([]);
  const [resources, setResources] = useState<{ id: string; name: string; default_employee_id: string | null }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [links, setLinks] = useState<{ service_id: string; employee_id: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [bs, e, r, s, l] = await Promise.all([
        supabase.from("business_settings").select("auto_assign_mode").eq("user_id", userId).maybeSingle(),
        supabase.from("employees").select("id, name").eq("user_id", userId).order("name"),
        supabase.from("resources").select("id, name, default_employee_id").eq("user_id", userId).order("sort_order"),
        supabase.from("services").select("id, name").eq("user_id", userId).order("sort_order"),
        supabase.from("service_employees").select("service_id, employee_id").eq("user_id", userId),
      ]);
      setMode(((bs.data?.auto_assign_mode as Mode) || "off"));
      setEmps(e.data || []); setResources(r.data || []); setServices(s.data || []); setLinks(l.data || []);
    })();
  }, [userId]);

  const saveMode = async (m: Mode) => {
    setMode(m);
    const { error } = await supabase.from("business_settings").update({ auto_assign_mode: m }).eq("user_id", userId);
    toast(error ? { title: "Could not save", description: error.message, variant: "destructive" } : { title: "Saved" });
  };

  const setResourceEmp = async (id: string, v: string) => {
    const val = v === "none" ? null : v;
    setResources((c) => c.map((r) => (r.id === id ? { ...r, default_employee_id: val } : r)));
    const { error } = await supabase.from("resources").update({ default_employee_id: val }).eq("id", id);
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
  };

  const toggleLink = async (service_id: string, employee_id: string, on: boolean) => {
    if (on) {
      setLinks((c) => [...c, { service_id, employee_id }]);
      const { error } = await supabase.from("service_employees").insert({ user_id: userId, service_id, employee_id });
      if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    } else {
      setLinks((c) => c.filter((x) => !(x.service_id === service_id && x.employee_id === employee_id)));
      await supabase.from("service_employees").delete().eq("service_id", service_id).eq("employee_id", employee_id);
    }
  };

  const label = resourceLabel.toLowerCase();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Choose how new bookings get a staff member. We only pick someone who is on shift at that time and not on holiday. If nobody fits, the booking stays Unassigned and you can pick someone by hand. You can always change it later.
      </p>
      <RadioGroup value={mode} onValueChange={(v) => saveMode(v as Mode)} className="space-y-2">
        {[
          { v: "off", t: "Off", d: "I'll assign staff myself." },
          { v: "resource", t: `By ${label}`, d: `Each ${label} belongs to one person, e.g. "Chair 1" is always Sam's.` },
          { v: "service", t: "By service", d: "Pick who does each service; we give it to whoever is free with the fewest bookings that day." },
        ].map((o) => (
          <label key={o.v} className="flex items-start gap-3 p-3 rounded-md border border-border bg-secondary/30 cursor-pointer">
            <RadioGroupItem value={o.v} className="mt-0.5" />
            <span><span className="text-sm font-medium text-foreground">{o.t}</span><span className="block text-xs text-muted-foreground">{o.d}</span></span>
          </label>
        ))}
      </RadioGroup>

      {emps.length === 0 && mode !== "off" && <p className="text-xs text-muted-foreground">Add staff first, then link them here.</p>}

      {mode === "resource" && emps.length > 0 && (
        resources.length === 0 ? (
          <p className="text-xs text-muted-foreground">Turn on bookable {label}s above and add some first.</p>
        ) : (
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <Label className="flex-1 text-sm">{r.name}</Label>
                <Select value={r.default_employee_id || "none"} onValueChange={(v) => setResourceEmp(r.id, v)}>
                  <SelectTrigger className="w-48 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Nobody</SelectItem>
                    {emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )
      )}

      {mode === "service" && emps.length > 0 && (
        services.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add services first, then tick who does each one.</p>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="p-3 rounded-md border border-border">
                <p className="text-sm font-medium text-foreground mb-2">{s.name}</p>
                <div className="flex flex-wrap gap-3">
                  {emps.map((e) => {
                    const on = links.some((x) => x.service_id === s.id && x.employee_id === e.id);
                    return (
                      <label key={e.id} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                        <Checkbox checked={on} onCheckedChange={(v) => toggleLink(s.id, e.id, !!v)} /> {e.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
