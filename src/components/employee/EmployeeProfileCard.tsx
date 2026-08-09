import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LogOut, KeyRound, Radio } from "lucide-react";
import { EmployeeRecord, todayISO } from "./types";

type Props = {
  employee: EmployeeRecord;
  email: string;
  companyName: string;
  onUpdated: (patch: Partial<EmployeeRecord>) => void;
  onLogout: () => void;
};

export default function EmployeeProfileCard({ employee, email, companyName, onUpdated, onLogout }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState(employee.name);
  const [phone, setPhone] = useState(employee.phone || "");
  const [position, setPosition] = useState(employee.position || "");
  const [saving, setSaving] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);

  const today = todayISO();
  const unavailableToday = employee.manual_status === "unavailable" && employee.manual_status_date === today;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("employees")
      .update({ name: name.trim(), phone: phone.trim() || null, position: position.trim() || null })
      .eq("id", employee.id);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    onUpdated({ name: name.trim(), phone: phone.trim() || null, position: position.trim() || null });
    toast({ title: "Profile updated" });
  };

  const setStatus = async (patch: Partial<EmployeeRecord>) => {
    setBusyStatus(true);
    const { error } = await supabase.from("employees").update(patch).eq("id", employee.id);
    setBusyStatus(false);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    onUpdated(patch);
  };

  const sendReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast({
      title: error ? "Couldn't send" : "Check your email",
      description: error ? error.message : "We've sent you a link to change your password.",
      variant: error ? "destructive" : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-foreground flex items-center gap-2">
                <Radio size={14} className={employee.available_now ? "text-success" : "text-muted-foreground"} />
                Available now
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Clients can be assigned to me right now.</p>
            </div>
            <Switch
              checked={employee.available_now}
              disabled={busyStatus}
              onCheckedChange={(v) => setStatus({ available_now: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <div>
              <p className="text-sm text-foreground">Unavailable today</p>
              <p className="text-xs text-muted-foreground mt-0.5">Shows on your manager's staff board.</p>
            </div>
            <Switch
              checked={unavailableToday}
              disabled={busyStatus}
              onCheckedChange={(v) =>
                setStatus(
                  v
                    ? { manual_status: "unavailable", manual_status_date: today }
                    : { manual_status: null, manual_status_date: null },
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Name</Label>
              <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-phone">Phone</Label>
              <Input id="emp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-position">Position</Label>
              <Input id="emp-position" value={position} onChange={(e) => setPosition(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-secondary/50 border-border" />
              <p className="text-[11px] text-muted-foreground">Company: {companyName}</p>
            </div>
            <Button type="submit" disabled={saving} className="w-full h-11 font-semibold">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Button variant="outline" onClick={sendReset} className="justify-start gap-2 h-11">
          <KeyRound size={16} /> Change password
        </Button>
        <Button variant="outline" onClick={onLogout} className="justify-start gap-2 h-11">
          <LogOut size={16} /> Log out
        </Button>
      </div>
    </div>
  );
}
