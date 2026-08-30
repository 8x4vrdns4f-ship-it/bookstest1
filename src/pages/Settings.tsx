import { publicOrigin } from "@/lib/publicUrl";
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
import {
  Copy, Check, LogOut, KeyRound, Trash2, XCircle,
  Building2, Clock, CalendarCheck, Bell, Shield, QrCode, Palette, Lock, LayoutGrid, ListChecks, TicketPercent,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ResourcesManager from "@/components/dashboard/ResourcesManager";
import ServicesManager from "@/components/dashboard/ServicesManager";
import CancelSubscriptionDialog from "@/components/dashboard/CancelSubscriptionDialog";
import { useToast } from "@/hooks/use-toast";
import SectionCard from "@/components/app/SectionCard";

import SEO from "@/components/SEO";
import RolesManager from "@/components/dashboard/RolesManager";
import PromoCodesManager from "@/components/dashboard/PromoCodesManager";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS, tierAllowsResources } from "@/lib/tierLimits";
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
  payment_mode: string;
  working_hours: WorkingHours;
  auto_confirm: boolean;
  allow_same_day: boolean;
  buffer_minutes: number;
  max_advance_days: number;
  cancellation_hours: number;
  pending_request_ttl_hours: number;
  notify_new_booking: boolean;
  notify_daily_summary: boolean;
  notify_client_confirmation: boolean;
  notify_client_reminder: boolean;
  notify_client_review_request: boolean;
  rebooking_reminder_enabled: boolean;
  rebooking_reminder_days: number;
  welcome_message: string;
  accent_color: string;
  self_checkin_enabled: boolean;
  reception_checkin_enabled: boolean;
  resources_enabled: boolean;
  resource_label: string;
  party_size_enabled: boolean;
  assignment_mode: "client_pick" | "auto";
  waitlist_enabled: boolean;
  services_enabled: boolean;
  booking_mode: "hourly" | "daily";
  min_rental_days: number;
  max_rental_days: number;

};

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tier } = useSubscription();
  const canBrand = tier ? TIER_LIMITS[tier].customBranding : false;
  const canReviews = tier ? TIER_LIMITS[tier].reviews : false;
  const canWaitlist = tier ? TIER_LIMITS[tier].waitlist : false;
  const canResources = tierAllowsResources(tier);
  const canDayMode = tier ? TIER_LIMITS[tier].dayMode : false;
  const canPromo = tier ? TIER_LIMITS[tier].promoCodes : false;
  const lockLabel = (allowed: boolean, need: "Gold" | "Platinum") => (allowed ? undefined : need);

  const [userId, setUserId] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    business_name: "", business_phone: "", business_email: "", business_address: "",
    business_category: "", currency: "GBP", timezone: "Europe/London", deposit_amount: 10, payment_mode: "deposit",
    working_hours: DEFAULT_HOURS, auto_confirm: false, allow_same_day: true,
    buffer_minutes: 0, max_advance_days: 30, cancellation_hours: 24, pending_request_ttl_hours: 48,
    notify_new_booking: true, notify_daily_summary: false,
    notify_client_confirmation: true, notify_client_reminder: true, notify_client_review_request: true,
    rebooking_reminder_enabled: false, rebooking_reminder_days: 60,
    welcome_message: "", accent_color: "#3B82F6",
    self_checkin_enabled: false, reception_checkin_enabled: true,
    resources_enabled: false, resource_label: "Resource",
    party_size_enabled: false, assignment_mode: "client_pick", waitlist_enabled: false, services_enabled: false,
    booking_mode: "hourly", min_rental_days: 1, max_rental_days: 30,

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
            payment_mode: (data as any).payment_mode || "deposit",
            working_hours: (data.working_hours as unknown as WorkingHours) || DEFAULT_HOURS,
            auto_confirm: data.auto_confirm,
            allow_same_day: data.allow_same_day,
            buffer_minutes: data.buffer_minutes,
            max_advance_days: data.max_advance_days,
            cancellation_hours: data.cancellation_hours,
            pending_request_ttl_hours: (data as any).pending_request_ttl_hours ?? 48,
            notify_new_booking: data.notify_new_booking,
            notify_daily_summary: data.notify_daily_summary,
            notify_client_confirmation: data.notify_client_confirmation,
            notify_client_reminder: data.notify_client_reminder,
            notify_client_review_request: (data as any).notify_client_review_request ?? true,
            rebooking_reminder_enabled: (data as any).rebooking_reminder_enabled ?? false,
            rebooking_reminder_days: Number((data as any).rebooking_reminder_days ?? 60),
            welcome_message: data.welcome_message || "",
            accent_color: data.accent_color || "#3B82F6",
            self_checkin_enabled: !!data.self_checkin_enabled,
            reception_checkin_enabled: data.reception_checkin_enabled ?? true,
            resources_enabled: (data as any).resources_enabled ?? false,
            resource_label: (data as any).resource_label ?? "Resource",
            party_size_enabled: (data as any).party_size_enabled ?? false,
            assignment_mode: ((data as any).assignment_mode as "client_pick" | "auto") ?? "client_pick",
            waitlist_enabled: (data as any).waitlist_enabled ?? false,
            services_enabled: (data as any).services_enabled ?? false,
            booking_mode: ((data as any).booking_mode as "hourly" | "daily") ?? "hourly",
            min_rental_days: Number((data as any).min_rental_days ?? 1),
            max_rental_days: Number((data as any).max_rental_days ?? 30),

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
    if (form.booking_mode === "daily" && form.max_rental_days < form.min_rental_days) {
      toast({ title: "Maximum days must be at least the minimum", variant: "destructive" }); return;
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
      redirectTo: `${publicOrigin()}/reset-password`,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Reset email sent", description: "Check your inbox." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <div className="py-24 text-center text-muted-foreground">Loading settings…</div>;
  }

  return (
    <>
      <SEO
        title="Settings — BookSuite"
        description="Manage your BookSuite business profile, working hours, booking preferences, and notifications."
        path="/settings"
        noIndex
      />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your business, hours, booking preferences and more.</p>
        </div>


        <Accordion type="multiple" defaultValue={["company", "hours"]} className="space-y-3">
          {/* Company Info */}
          <SectionCard>
            <AccordionItem value="company" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <Building2 size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Company Info</span>
                </span>
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
          </SectionCard>

          {/* Working Hours */}
          <SectionCard>
            <AccordionItem value="hours" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <Clock size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Working Hours</span>
                </span>
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
          </SectionCard>

          {/* Booking Preferences */}
          <SectionCard>
            <AccordionItem value="booking" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <CalendarCheck size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Booking Preferences</span>
                </span>
              </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Booking length</p>
                  <p className="text-xs text-muted-foreground">Choose how clients book your time — by the hour, or by the day for rentals and hire.</p>
                </div>
                {[
                  { key: "hourly", label: "By the hour", hint: "Clients pick a date and a time slot. Best for appointments." },
                  { key: "daily", label: "By the day", hint: "Clients pick a pick-up and return date. Best for car, equipment or venue hire." },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (opt.key === "daily" && !canDayMode) return;
                      setForm({ ...form, booking_mode: opt.key as "hourly" | "daily" });
                    }}
                    disabled={opt.key === "daily" && !canDayMode}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${form.booking_mode === opt.key ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary"}`}
                  >
                    <span className="block text-sm font-medium text-foreground">
                      {opt.label}
                      {opt.key === "daily" && !canDayMode && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary align-middle">
                          <Lock size={10} /> Gold
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                  </button>
                ))}
                {form.booking_mode === "daily" && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Field label="Minimum days" hint="Shortest hire length.">
                      <Input type="number" min={1} max={365} value={form.min_rental_days} onChange={(e) => setForm({ ...form, min_rental_days: Number(e.target.value) })} className="bg-secondary border-border" />
                    </Field>
                    <Field label="Maximum days" hint="Longest hire length.">
                      <Input type="number" min={1} max={365} value={form.max_rental_days} onChange={(e) => setForm({ ...form, max_rental_days: Number(e.target.value) })} className="bg-secondary border-border" />
                    </Field>
                  </div>
                )}
                {form.booking_mode === "daily" && (
                  <p className="text-xs text-muted-foreground">
                    In day mode, service prices are treated as a <strong className="text-foreground">per-day rate</strong>, and each booking blocks the whole date range for that {form.resource_label.toLowerCase() || "resource"}.
                  </p>
                )}
              </div>

              <Field label={`Deposit per booking (${form.currency}) — min £10`} hint="Charged only when you accept a booking.">
                <Input type="number" min={10} step="0.50" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: Number(e.target.value) })} className="bg-secondary border-border" />
              </Field>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Payment at booking</p>
                  <p className="text-xs text-muted-foreground">Applies when a service has a price set. Without a price, only the deposit is taken.</p>
                </div>
                {[
                  { key: "deposit", label: "Deposit only", hint: "Client pays the deposit; the rest is paid on the day." },
                  { key: "full", label: "Pay in full", hint: "Client pays the full service price when you accept." },
                  { key: "client_choice", label: "Let the client choose", hint: "Client picks deposit only or pay in full in the booking widget." },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setForm({ ...form, payment_mode: opt.key })}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${form.payment_mode === opt.key ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary"}`}
                  >
                    <span className="block text-sm font-medium text-foreground">{opt.label}</span>

                    <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                  </button>
                ))}
              </div>
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
              <Field label="Pending request expiry (hours)" hint="How long a booking request stays open before it's auto-declined and the card released.">
                <Input type="number" min={1} max={168} value={form.pending_request_ttl_hours} onChange={(e) => setForm({ ...form, pending_request_ttl_hours: Number(e.target.value) })} className="bg-secondary border-border" />
              </Field>
            </AccordionContent>
          </AccordionItem>
          </SectionCard>

          {/* Services */}
          <SectionCard>
            <AccordionItem value="services" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <ListChecks size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Services</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5">
                <p className="text-xs text-muted-foreground">
                  Turn this on to show a menu of services in your booking widget. Each service sets its own length, so clients never have to guess a duration.
                </p>
                <ToggleRow
                  label="Enable service menu"
                  hint="Clients pick a service; the duration is applied automatically."
                  checked={form.services_enabled}
                  onChange={(v) => setForm({ ...form, services_enabled: v })}
                />
                {form.services_enabled && userId && (
                  <div className="pt-2 border-t border-border">
                    <Label className="text-foreground">Your services</Label>
                    <div className="mt-3"><ServicesManager userId={userId} currency={form.currency} /></div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </SectionCard>

          {/* Bookable Resources */}
          <SectionCard>
            <AccordionItem value="resources" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <LayoutGrid size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Bookable Resources</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5">
                <p className="text-xs text-muted-foreground">
                  Turn this on if clients should pick a specific table, room, chair, court, etc. when booking.
                </p>
                <ToggleRow
                  label="Enable resource selection"
                  hint="Adds a resource picker to your booking widget."
                  checked={form.resources_enabled}
                  onChange={(v) => setForm({ ...form, resources_enabled: v })}
                  lockedTier={lockLabel(canResources, "Gold")}
                />
                {form.resources_enabled && canResources && (
                  <>
                    <Field label="Resource label" hint="Shown on the widget, e.g. Table, Room, Chair, Court.">
                      <Input
                        value={form.resource_label}
                        onChange={(e) => setForm({ ...form, resource_label: e.target.value })}
                        className="bg-secondary border-border max-w-[220px]"
                        maxLength={40}
                      />
                    </Field>
                    <ToggleRow
                      label="Ask for party size"
                      hint="Client enters number of guests; only resources big enough are offered."
                      checked={form.party_size_enabled}
                      onChange={(v) => setForm({ ...form, party_size_enabled: v })}
                    />
                    <div className="space-y-2">
                      <Label className="text-foreground">Assignment</Label>
                      <p className="text-xs text-muted-foreground">Who chooses which resource the booking goes to.</p>
                      <RadioGroup
                        value={form.assignment_mode}
                        onValueChange={(v) => setForm({ ...form, assignment_mode: v as "client_pick" | "auto" })}
                        className="space-y-2"
                      >
                        <label className="flex items-start gap-3 p-3 rounded-md bg-secondary/40 border border-border cursor-pointer">
                          <RadioGroupItem value="client_pick" id="am-client" className="mt-0.5" />
                          <div>
                            <p className="text-sm text-foreground font-medium">Client picks</p>
                            <p className="text-xs text-muted-foreground">Client selects a specific {form.resource_label.toLowerCase() || "resource"} from the ones available.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 rounded-md bg-secondary/40 border border-border cursor-pointer">
                          <RadioGroupItem value="auto" id="am-auto" className="mt-0.5" />
                          <div>
                            <p className="text-sm text-foreground font-medium">Auto-assign</p>
                            <p className="text-xs text-muted-foreground">We pick the first free {form.resource_label.toLowerCase() || "resource"} that fits. You can reassign later.</p>
                          </div>
                        </label>
                      </RadioGroup>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Label className="text-foreground">Your {form.resource_label.toLowerCase() || "resource"}s</Label>
                      {userId && <div className="mt-3"><ResourcesManager userId={userId} label={form.resource_label || "Resource"} /></div>}
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </SectionCard>


          {/* Notifications */}
          <SectionCard>
            <AccordionItem value="notif" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <Bell size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Notifications</span>
                </span>
              </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-5">
              <ToggleRow label="New Booking Email" hint="Get an email on every new booking." checked={form.notify_new_booking} onChange={(v) => setForm({ ...form, notify_new_booking: v })} />
              <ToggleRow label="Daily Summary Email" hint="Recap of tomorrow's appointments." checked={form.notify_daily_summary} onChange={(v) => setForm({ ...form, notify_daily_summary: v })} />
              <ToggleRow label="Client Booking Confirmation" hint="Email clients when their booking is confirmed." checked={form.notify_client_confirmation} onChange={(v) => setForm({ ...form, notify_client_confirmation: v })} />
              <ToggleRow label="Client Reminder" hint="Send clients a reminder 24 hours before their appointment." checked={form.notify_client_reminder} onChange={(v) => setForm({ ...form, notify_client_reminder: v })} />
              <ToggleRow label="Client Review Request" hint="Ask clients for a review after their appointment." checked={form.notify_client_review_request} onChange={(v) => setForm({ ...form, notify_client_review_request: v })} lockedTier={lockLabel(canReviews, "Gold")} />
              <ToggleRow label="Waitlist" hint="Let clients join a waitlist for fully-booked dates, and auto-email them when a slot opens." checked={form.waitlist_enabled} onChange={(v) => setForm({ ...form, waitlist_enabled: v })} lockedTier={lockLabel(canWaitlist, "Gold")} />
              <ToggleRow label="Rebooking Reminders" hint="Automatically email clients who haven't booked in a while." checked={form.rebooking_reminder_enabled} onChange={(v) => setForm({ ...form, rebooking_reminder_enabled: v })} />
              {form.rebooking_reminder_enabled && (
                <div className="flex items-center justify-between gap-3 pl-1 pr-1">
                  <label htmlFor="rebooking-days" className="text-sm text-muted-foreground">
                    Remind after this many quiet days
                  </label>
                  <Input
                    id="rebooking-days"
                    type="number"
                    min={7}
                    max={365}
                    className="w-24"
                    value={form.rebooking_reminder_days}
                    onChange={(e) => setForm({ ...form, rebooking_reminder_days: Math.max(7, Math.min(365, Number(e.target.value) || 60)) })}
                  />
                </div>
              )}
            </AccordionContent>

          </AccordionItem>
          </SectionCard>

          {/* Roles & Permissions */}
          <SectionCard>
            <AccordionItem value="roles" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <Shield size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Roles &amp; Permissions</span>
                </span>
              </AccordionTrigger>
            <AccordionContent className="pb-5">
              {userId && <RolesManager userId={userId} />}
            </AccordionContent>
          </AccordionItem>
          </SectionCard>

          {/* Promo Codes */}
          <SectionCard>
            <AccordionItem value="promos" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <TicketPercent size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Promo Codes</span>
                </span>
              </AccordionTrigger>
            <AccordionContent>
              {canPromo ? (
                userId && <PromoCodesManager userId={userId} />
              ) : (
                <p className="text-sm text-muted-foreground pb-5">
                  Promo codes are available on the Gold and Platinum plans.{" "}
                  <Link to="/pricing" className="text-primary underline underline-offset-2">Upgrade</Link>
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
          </SectionCard>

          {/* Check-In */}
          <SectionCard>
            <AccordionItem value="checkin" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <QrCode size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Check-In</span>
                </span>
              </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-5">
              <ToggleRow
                label="Self check-in kiosk"
                hint={`Customers scan the QR code on their booking at a kiosk. Kiosk URL: ${publicOrigin()}/kiosk/${companyCode}`}
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
          </SectionCard>

          {/* Booking Page */}
          <SectionCard>
            <AccordionItem value="page" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <Palette size={20} />
                  </span>
                  <span className="text-base font-semibold text-foreground leading-tight">Booking Page</span>
                </span>
              </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              {!canBrand && (
                <div className="flex items-center justify-between gap-3 bg-secondary/60 border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock size={14} className="text-primary" />
                    Custom branding is a Gold &amp; Platinum feature.
                  </div>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/pricing">Upgrade</Link>
                  </Button>
                </div>
              )}
              <Field label="Welcome Message" hint="Shown at the top of your public booking page.">
                <Textarea
                  value={form.welcome_message}
                  onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                  className="bg-secondary border-border"
                  rows={2}
                  disabled={!canBrand}
                />
              </Field>
              <Field label="Accent Color" hint="Primary color for your booking page.">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 w-16 rounded cursor-pointer bg-secondary border border-border disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canBrand} />
                  <Input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="bg-secondary border-border max-w-[140px]" disabled={!canBrand} />
                </div>
              </Field>
            </AccordionContent>

          </AccordionItem>
          </SectionCard>
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
            <DangerRow icon={<XCircle size={16} />} title="Cancel Subscription" hint="Instantly ends your plan and removes access. You won't be eligible for the free trial again." action={<CancelSubscriptionDialog />} />
            <DangerRow icon={<LogOut size={16} />} title="Log Out" hint="Sign out on this device." action={<Button variant="outline" onClick={handleLogout}>Log Out</Button>} />
            <DangerRow icon={<Trash2 size={16} />} title="Delete Account" hint="Permanently delete your account. (Coming soon.)" action={<Button variant="destructive" disabled>Delete Account</Button>} />
          </CardContent>
        </Card>
      </div>
    </>
  );

};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-foreground">{label}</Label>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    {children}
  </div>
);

const ToggleRow = ({ label, hint, checked, onChange, lockedTier }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; lockedTier?: string }) => (
  <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-secondary/40">
    <div>
      <p className="text-sm text-foreground font-medium flex items-center gap-2">
        {label}
        {lockedTier && (
          <Link to="/pricing" className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            <Lock size={10} /> {lockedTier}
          </Link>
        )}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
    <Switch checked={lockedTier ? false : checked} onCheckedChange={onChange} disabled={!!lockedTier} />
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
