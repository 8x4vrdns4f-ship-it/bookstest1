import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, Check, LogOut, KeyRound, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import RolesManager from "@/components/dashboard/RolesManager";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS } from "@/lib/tierLimits";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

type DayHours = { open: string; close: string; closed: boolean };
type WorkingHours = Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", DayHours>;

const DEFAULT_HOURS: WorkingHours = {
  mon: { open: "09:00", close: "18:00", closed: false },
  tue: { open: "09:00", close: "18:00", closed: false },
  wed: { open: "09:00", close: "18:00", closed: false },
  thu: { open: "09:00", close: "18:00", closed: false },
  fri: { open: "09:00", close: "18:00", closed: false },
  sat: { open: "10:00", close: "16:00", closed: false },
  sun: { open: "10:00", close: "16:00", closed: true },
};

const DAYS: { key: keyof WorkingHours; label: string }[] = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" }, { key: "sun", label: "Sun" },
];

type SettingsForm = {
  business_name: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  business_category: string;
  currency: string;
  timezone: string;
  deposit_amount: number;
  working_hours: WorkingHours;
  auto_confirm: boolean;
  allow_same_day: boolean;
  buffer_minutes: number;
  max_advance_days: number;
  cancellation_hours: number;
  notify_new_booking: boolean;
  notify_daily_summary: boolean;
  notify_client_confirmation: boolean;
  notify_client_reminder: boolean;
  welcome_message: string;
  accent_color: string;
  self_checkin_enabled: boolean;
  reception_checkin_enabled: boolean;
};

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    business_name: "", business_phone: "", business_email: "", business_address: "",
    business_category: "", currency: "GBP", timezone: "Europe/London", deposit_amount: 10,
    working_hours: DEFAULT_HOURS, auto_confirm: false, allow_same_day: true,
    buffer_minutes: 0, max_advance_days: 30, cancellation_hours: 24,
    notify_new_booking: true, notify_daily_summary: false,
    notify_client_confirmation: true, notify_client_reminder: true,
    welcome_message: "", accent_color: "#3B82F6",
    self_checkin_enabled: false, reception_checkin_enabled: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
    });
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("business_settings").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCompanyCode(data.company_code || "");
          setForm({
            business_name: data.business_name || "",
            business_phone: data.business_phone || "",
            business_email: data.business_email || "",
            business_address: data.business_address || "",
            business_category: data.business_category || "",
            currency: data.currency || "GBP",
            timezone: data.timezone || "Europe/London",
            deposit_amount: Number(data.deposit_amount),
            working_hours: (data.working_hours as unknown as WorkingHours) || DEFAULT_HOURS,
            auto_confirm: data.auto_confirm,
            allow_same_day: data.allow_same_day,
            buffer_minutes: data.buffer_minutes,
            max_advance_days: data.max_advance_days,
            cancellation_hours: data.cancellation_hours,
            notify_new_booking: data.notify_new_booking,
            notify_daily_summary: data.notify_daily_summary,
            notify_client_confirmation: data.notify_client_confirmation,
            notify_client_reminder: data.notify_client_reminder,
            welcome_message: data.welcome_message || "",
            accent_color: data.accent_color || "#3B82F6",
            self_checkin_enabled: !!data.self_checkin_enabled,
            reception_checkin_enabled: data.reception_checkin_enabled ?? true,
          });
        }
        setLoading(false);
      });
  }, [userId]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(companyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Code copied" });
  };

  const updateDay = (day: keyof WorkingHours, patch: Partial<DayHours>) => {
    setForm({ ...form, working_hours: { ...form.working_hours, [day]: { ...form.working_hours[day], ...patch } } });
  };

  const handleSave = async () => {
    if (!userId) return;
    if (form.deposit_amount < 10) { toast({ title: "Deposit must be at least £10", variant: "destructive" }); return; }
    if (!form.self_checkin_enabled && !form.reception_checkin_enabled) {
      toast({ title: "Enable at least one check-in method", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("business_settings").upsert(
      { user_id: userId, ...form, working_hours: form.working_hours as never },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Settings saved" });
  };

  const handleResetPassword = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Reset email sent", description: "Check your inbox." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading settings…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Settings — BookSuite"
        description="Manage your BookSuite business profile, working hours, booking preferences, and notifications."
        path="/settings"
        noIndex
      />
      <Navbar />
      <main className="flex-1 px-6 md:px-16 py-8 max-w-4xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your business, hours, booking preferences and more.</p>
        </div>

        <Accordion type="multiple" defaultValue={["company", "hours"]} className="space-y-3">
          {/* Company Info */}
          <AccordionItem value="company" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-foreground font-semibold">Company Info</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-5 pb-5">
              <div className="space-y-2">
                <Label className="text-foreground">Company Code</Label>
                <p className="text-xs text-muted-foreground">Share this code with staff so they can join your company.</p>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-md font-mono text-primary hover:border-primary transition-colors"
                >
                  {companyCode || "—"}
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-muted-foreground" />}
                </button>
              </div>
              <Field label="Business Name" hint="Displayed on your booking page.">
                <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="bg-secondary border-border" />
              </Field>
              <Field label="Business Phone" hint="Contact number for clients.">
                <Input value={form.business_phone} onChange={(e) => setForm({ ...form, business_phone: e.target.value })} className="bg-secondary border-border" />
              </Field>
              <Field label="Business Email" hint="Public email clients can reach you at.">
                <Input type="email" value={form.business_email} onChange={(e) => setForm({ ...form, business_email: e.target.value })} className="bg-secondary border-border" />
              </Field>
              <Field label="Business Address" hint="Your location shown to clients.">
                <Textarea value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} className="bg-secondary border-border" rows={2} />
              </Field>
              <Field label="Business Category" hint="What type of business you run.">
                <Select value={form.business_category || ""} onValueChange={(v) => setForm({ ...form, business_category: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {["Barber", "Hair Salon", "Beauty", "Fitness", "Health", "Tattoo", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Currency" hint="Currency on invoices.">
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{["GBP", "USD", "EUR", "CAD", "AUD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Timezone" hint="Used for booking times.">
                  <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Australia/Sydney"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Working Hours */}
          <AccordionItem value="hours" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-foreground font-semibold">Working Hours</span>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <p className="text-xs text-muted-foreground mb-4">Clients can only book during open hours. Uncheck a day to mark it as closed.</p>
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const d = form.working_hours[key];
                  return (
                    <div key={key} className="flex items-center gap-3 p-2 rounded-md bg-secondary/40">
                      <Checkbox
                        checked={!d.closed}
                        onCheckedChange={(v) => updateDay(key, { closed: !v })}
                        id={`day-${key}`}
                      />
                      <Label htmlFor={`day-${key}`} className="w-12 text-foreground">{label}</Label>
                      <Input type="time" disabled={d.closed} value={d.open} onChange={(e) => updateDay(key, { open: e.target.value })} className="bg-background border-border max-w-[130px]" />
                      <span className="text-muted-foreground">–</span>
                      <Input type="time" disabled={d.closed} value={d.close} onChange={(e) => updateDay(key, { close: e.target.value })} className="bg-background border-border max-w-[130px]" />
                      {d.closed && <span className="text-xs text-muted-foreground ml-auto">Closed</span>}
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Booking Preferences */}
          <AccordionItem value="booking" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-foreground font-semibold">Booking Preferences</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <Field label={`Deposit per booking (${form.currency}) — min £10`} hint="Charged only when you accept a booking.">
                <Input type="number" min={10} step="0.50" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: Number(e.target.value) })} className="bg-secondary border-border" />
              </Field>
              <ToggleRow label="Auto-confirm Bookings" hint="Skip manual approval." checked={form.auto_confirm} onChange={(v) => setForm({ ...form, auto_confirm: v })} />
              <ToggleRow label="Allow Same-day Booking" hint="Let clients book today." checked={form.allow_same_day} onChange={(v) => setForm({ ...form, allow_same_day: v })} />
              <Field label="Booking Buffer (minutes)" hint="Gap between back-to-back appointments.">
                <Input type="number" min={0} max={120} value={form.buffer_minutes} onChange={(e) => setForm({ ...form, buffer_minutes: Number(e.target.value) })} className="bg-secondary border-border" />
              </Field>
              <Field label="Max Advance Booking (days)" hint="How far in advance clients can book.">
                <Input type="number" min={1} max={365} value={form.max_advance_days} onChange={(e) => setForm({ ...form, max_advance_days: Number(e.target.value) })} className="bg-secondary border-border" />
              </Field>
              <Field label="Cancellation Policy (hours)" hint="Minimum notice required to cancel.">
                <Input type="number" min={0} max={168} value={form.cancellation_hours} onChange={(e) => setForm({ ...form, cancellation_hours: Number(e.target.value) })} className="bg-secondary border-border" />
              </Field>
            </AccordionContent>
          </AccordionItem>

          {/* Notifications */}
          <AccordionItem value="notif" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-foreground font-semibold">Notifications</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-5">
              <ToggleRow label="Email Notifications" hint="Get an email on every new booking." checked={form.notify_new_booking} onChange={(v) => setForm({ ...form, notify_new_booking: v })} />
              <ToggleRow label="Daily Summary Email" hint="Recap of tomorrow's appointments." checked={form.notify_daily_summary} onChange={(v) => setForm({ ...form, notify_daily_summary: v })} />
              <ToggleRow label="Client Booking Confirmation" hint="Email clients when their booking is confirmed." checked={form.notify_client_confirmation} onChange={(v) => setForm({ ...form, notify_client_confirmation: v })} />
              <ToggleRow label="Reminder Before Appointment" hint="Send a reminder before the appointment." checked={form.notify_client_reminder} onChange={(v) => setForm({ ...form, notify_client_reminder: v })} />
            </AccordionContent>
          </AccordionItem>

          {/* Roles & Permissions */}
          <AccordionItem value="roles" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-foreground font-semibold">Roles &amp; Permissions</span>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              {userId && <RolesManager userId={userId} />}
            </AccordionContent>
          </AccordionItem>

          {/* Check-In */}
          <AccordionItem value="checkin" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-foreground font-semibold">Check-In</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-5">
              <ToggleRow
                label="Self check-in kiosk"
                hint={`Customers scan the QR code on their booking at a kiosk. Kiosk URL: ${window.location.origin}/kiosk/${companyCode}`}
                checked={form.self_checkin_enabled}
                onChange={(v) => setForm({ ...form, self_checkin_enabled: v })}
              />
              <ToggleRow
                label="Receptionist check-in"
                hint="Receptionists scan or type the customer's code, then handle the next steps."
                checked={form.reception_checkin_enabled}
                onChange={(v) => setForm({ ...form, reception_checkin_enabled: v })}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Booking Page */}
          <AccordionItem value="page" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-foreground font-semibold">Booking Page</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <Field label="Welcome Message" hint="Shown at the top of your public booking page.">
                <Textarea value={form.welcome_message} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} className="bg-secondary border-border" rows={2} />
              </Field>
              <Field label="Accent Color" hint="Primary color for your booking page.">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 w-16 rounded cursor-pointer bg-secondary border border-border" />
                  <Input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="bg-secondary border-border max-w-[140px]" />
                </div>
              </Field>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={handleSave} disabled={saving} className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
          {saving ? "Saving…" : "Save All Changes"}
        </Button>

        {/* Danger Zone */}
        <Card className="mt-8 bg-card border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Account-level actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DangerRow icon={<KeyRound size={16} />} title="Reset Password" hint="Send a password reset email." action={<Button variant="outline" onClick={handleResetPassword}>Reset Password</Button>} />
            <DangerRow icon={<LogOut size={16} />} title="Log Out" hint="Sign out on this device." action={<Button variant="outline" onClick={handleLogout}>Log Out</Button>} />
            <DangerRow icon={<Trash2 size={16} />} title="Delete Account" hint="Permanently delete your account. (Coming soon.)" action={<Button variant="destructive" disabled>Delete Account</Button>} />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-foreground">{label}</Label>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    {children}
  </div>
);

const ToggleRow = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-secondary/40">
    <div>
      <p className="text-sm text-foreground font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const DangerRow = ({ icon, title, hint, action }: { icon: React.ReactNode; title: string; hint: string; action: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-secondary/40">
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-sm text-foreground font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
    {action}
  </div>
);

export default Settings;
