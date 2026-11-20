import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  const [bulkEmp, setBulkEmp] = useState<string>("");
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const saveFailed = (what: string, error: unknown) => {
    console.error(`AutoAssignCard ${what} save failed`, error);
    toast({ title: "Couldn't save", description: "Please try again. If it keeps happening, email help@booksuite.online.", variant: "destructive" });
  };

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
    if (error) saveFailed("mode", error); else toast({ title: "Saved" });
  };

  const setResourceEmp = async (id: string, v: string) => {
    const val = v === "none" ? null : v;
    setResources((c) => c.map((r) => (r.id === id ? { ...r, default_employee_id: val } : r)));
    const { error } = await supabase.from("resources").update({ default_employee_id: val }).eq("id", id);
    if (error) saveFailed("resource", error);
  };

  const toggleLink = async (service_id: string, employee_id: string, on: boolean) => {
    if (on) {
      setLinks((c) => [...c, { service_id, employee_id }]);
      const { error } = await supabase.from("service_employees").insert({ user_id: userId, service_id, employee_id });
      if (error) saveFailed("service link", error);
    } else {
      setLinks((c) => c.filter((x) => !(x.service_id === service_id && x.employee_id === employee_id)));
      const { error } = await supabase.from("service_employees").delete().eq("service_id", service_id).eq("employee_id", employee_id);
      if (error) saveFailed("service unlink", error);
    }
  };

  const label = resourceLabel.toLowerCase();
  const capLabel = label.charAt(0).toUpperCase() + label.slice(1);
  const empName = (id: string | null) => emps.find((e) => e.id === id)?.name || "";

  const applyBulk = async () => {
    if (!bulkEmp || bulkIds.length === 0) return;
    const val = bulkEmp === "none" ? null : bulkEmp;
    const ids = [...bulkIds];
    setBulkSaving(true);
    const { error } = await supabase.from("resources").update({ default_employee_id: val }).in("id", ids).eq("user_id", userId);
    setBulkSaving(false);
    if (error) { saveFailed("bulk resource", error); return; }
    setResources((c) => c.map((r) => (ids.includes(r.id) ? { ...r, default_employee_id: val } : r)));
    setBulkIds([]);
    toast({ title: val ? `Saved: ${ids.length} ${label}s now go to ${empName(val)}` : `Saved: ${ids.length} ${label}s now go to nobody` });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Choose how new bookings get a staff member. We only pick someone who is on shift at that time and not on holiday. If nobody fits, the booking stays Unassigned and you can pick someone by hand. You can always change it later.
      </p>
      <RadioGroup value={mode} onValueChange={(v) => saveMode(v as Mode)} className="space-y-2">
        {[
          { v: "off", t: "Off", d: "I'll assign staff myself." },
          { v: "resource", t: `By ${label}`, d: `Each ${label} is looked after by one person, and one person can look after several, e.g. "${capLabel}s 1 to 6 are Sam's".` },
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
          <div className="space-y-4">
          <div className="p-3 rounded-md border border-border bg-secondary/30 space-y-3">
            <p className="text-sm font-medium text-foreground">Give several at once</p>
            <Select value={bulkEmp} onValueChange={setBulkEmp}>
              <SelectTrigger className="h-10 bg-secondary border-border"><SelectValue placeholder="Pick a person" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="none">Nobody</SelectItem>
                {emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => setBulkIds(resources.map((r) => r.id))}>Select all</Button>
              <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => setBulkIds([])}>Clear</Button>
            </div>
            <div className="space-y-1">
              {resources.map((r) => (
                <label key={r.id} className="flex items-center gap-3 min-h-10 text-sm text-foreground cursor-pointer">
                  <Checkbox checked={bulkIds.includes(r.id)} onCheckedChange={(v) => setBulkIds((c) => (v ? [...c, r.id] : c.filter((x) => x !== r.id)))} />
                  <span>{r.name}{r.default_employee_id && <span className="text-muted-foreground"> · currently {empName(r.default_employee_id)}</span>}</span>
                </label>
              ))}
            </div>
            <Button type="button" className="h-10 w-full sm:w-auto" disabled={!bulkEmp || bulkIds.length === 0 || bulkSaving} onClick={applyBulk}>
              {bulkEmp === "none" ? `Clear ${bulkIds.length} ${label}s` : bulkEmp ? `Give to ${empName(bulkEmp)}` : "Give to..."}
            </Button>
          </div>
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <Label className="flex-1 text-sm">{r.name}</Label>
                <Select value={r.default_employee_id || "none"} onValueChange={(v) => setResourceEmp(r.id, v)}>
                  <SelectTrigger className="w-48 h-10 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Nobody</SelectItem>
                    {emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            {emps.map((e) => {
              const mine = resources.filter((r) => r.default_employee_id === e.id).map((r) => r.name);
              return mine.length ? <p key={e.id} className="text-xs text-muted-foreground">{e.name}: {mine.join(", ")}</p> : null;
            })}
          </div>
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
