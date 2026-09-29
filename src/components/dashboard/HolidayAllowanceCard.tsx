import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES: { code: string; label: string }[] = [
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "IE", label: "Ireland" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" },
  { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" },
];

const HolidayAllowanceCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [days, setDays] = useState("28");
  const [country, setCountry] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("business_settings")
        .select("default_leave_days, holiday_country")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setDays(String(data.default_leave_days ?? 28));
        setCountry(data.holiday_country || "none");
      }
      setLoaded(true);
    })();
  }, [userId]);

  const save = async () => {
    const n = parseInt(days, 10);
    if (isNaN(n) || n < 0 || n > 366) {
      toast({ title: "Enter a number between 0 and 366", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("business_settings")
      .update({ default_leave_days: n, holiday_country: country === "none" ? null : country })
      .eq("user_id", userId);
    if (!error && country !== "none") {
      // Fill that country's bank holidays in the background; not fatal if it fails.
      supabase.functions.invoke("sync-public-holidays", { body: { country } }).catch(() => {});
    }
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Holiday settings saved" });
  };

  if (!loaded) return null;

  return (
    <div className="space-y-4 pb-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="leave-days">Default holiday days per year</Label>
          <Input
            id="leave-days"
            type="number"
            min={0}
            max={366}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="bg-secondary border-border"
          />
          <p className="text-xs text-muted-foreground">
            New team members start with this. You can change it per person when you add them.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Bank holidays</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Don't skip bank holidays</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Bank holidays in this country won't count against anyone's allowance.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Allowances reset every 1 January. Only days the team member is actually scheduled to work count — days off, closed days and bank holidays are free.
      </p>
      <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
        {saving ? "Saving…" : "Save holiday settings"}
      </Button>
    </div>
  );
};

export default HolidayAllowanceCard;
