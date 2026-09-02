import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail } from "lucide-react";

type Detail = {
  owner_email: string | null;
  profile: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  connect_account: Record<string, unknown> | null;
  counts: Record<string, number>;
  revenue: { charged_total: number; platform_fees: number };
  avg_rating: number | null;
  employees: { id: string; name: string; email: string; position: string | null; linked: boolean }[];
  services: { id: string; name: string; duration_minutes: number; price: number | null; active: boolean }[];
  recent_bookings: { id: string; client_name: string; service: string; booking_date: string; booking_time: string; status: string; payment_status: string; charge_amount: number | null }[];
};
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
function Row({ label, value }: { label: string; value: React.ReactNode }) { return <div className="flex items-start justify-between gap-4 py-1.5"><span className="text-xs text-muted-foreground">{label}</span><span className="text-sm text-right break-words">{value ?? "—"}</span></div>; }
function Block({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-1"><h3 className="text-xs uppercase tracking-widest text-muted-foreground">{title}</h3><div className="rounded-2xl border border-border bg-card/50 p-4">{children}</div></section>; }

export default function BusinessDetailSheet({ userId, onOpenChange }: { userId: string | null; onOpenChange: (open: boolean) => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    if (!userId) { setDetail(null); return; }
    setLoading(true); setError(null);
    (async () => { const { data, error } = await supabase.rpc("admin_business_detail", { p_user_id: userId }); if (error) setError(error.message); else setDetail(data as unknown as Detail); setLoading(false); })();
  }, [userId]);
  const s = (detail?.settings ?? {}) as Record<string, unknown>;
  const sub = (detail?.subscription ?? {}) as Record<string, unknown>;
  const connect = (detail?.connect_account ?? {}) as Record<string, unknown>;
  const currency = typeof s.currency === "string" ? s.currency : "GBP";
  const money = (n: number | null | undefined) => n == null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(n));
  const ownerEmail = detail?.owner_email;
  const copy = async (text: string) => { await navigator.clipboard.writeText(text); toast({ title: "Copied", description: text }); };

  return <Sheet open={!!userId} onOpenChange={onOpenChange}><SheetContent className="w-full sm:max-w-xl overflow-y-auto"><SheetHeader><SheetTitle>{typeof s.business_name === "string" ? s.business_name : "Business details"}</SheetTitle><SheetDescription>{ownerEmail || "Full account overview"}</SheetDescription></SheetHeader>{loading && <p className="text-sm text-muted-foreground mt-6">Loading details…</p>}{error && <p className="text-sm text-destructive mt-6">{error}</p>}{detail && !loading && <div className="mt-6 space-y-5">
    <div className="flex flex-wrap gap-2"><Badge variant="secondary" className="capitalize">{typeof sub.tier === "string" ? sub.tier : "no plan"}</Badge><Badge variant={sub.subscribed ? "default" : "secondary"} className="capitalize">{typeof sub.status === "string" ? sub.status : "inactive"}</Badge>{connect.charges_enabled ? <Badge variant="default">Payments live</Badge> : <Badge variant="secondary">Payments not connected</Badge>}</div>
    {ownerEmail && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => copy(ownerEmail)}><Copy className="h-4 w-4 mr-1.5" /> Copy email</Button><Button size="sm" variant="outline" asChild><a href={`mailto:${ownerEmail}`}><Mail className="h-4 w-4 mr-1.5" /> Email owner</a></Button></div>}
    <div className="grid grid-cols-3 gap-3">{[["Bookings", detail.counts.bookings], ["Last 30d", detail.counts.bookings_30d], ["Clients", detail.counts.clients], ["Staff", detail.counts.employees], ["Services", detail.counts.services], ["Resources", detail.counts.resources], ["Reviews", detail.counts.reviews], ["Waitlist", detail.counts.waitlist], ["Promo codes", detail.counts.promo_codes]].map(([label, value]) => <div key={label as string} className="rounded-xl border border-border bg-card p-3"><p className="text-lg font-semibold">{value as number}</p><p className="text-[11px] text-muted-foreground">{label as string}</p></div>)}</div>
    <Block title="Business profile"><Row label="Category" value={<span className="capitalize">{typeof s.business_category === "string" ? s.business_category : "—"}</span>} /><Row label="Phone" value={typeof s.business_phone === "string" ? s.business_phone : "—"} /><Row label="Email" value={typeof s.business_email === "string" ? s.business_email : "—"} /><Row label="Address" value={typeof s.business_address === "string" ? s.business_address : "—"} /><Row label="Company code" value={<span className="font-mono">{typeof s.company_code === "string" ? s.company_code : "—"}</span>} /><Row label="Timezone" value={typeof s.timezone === "string" ? s.timezone : "—"} /><Row label="Currency" value={currency} /><Row label="Booking mode" value={<span className="capitalize">{typeof s.booking_mode === "string" ? s.booking_mode : "—"}</span>} /><Row label="Payment mode" value={<span className="capitalize">{typeof s.payment_mode === "string" ? s.payment_mode : "—"}</span>} /><Row label="Deposit" value={money(typeof s.deposit_amount === "number" ? s.deposit_amount : null)} /><Row label="Onboarding" value={typeof s.onboarding_completed_at === "string" ? `Completed ${fmtDate(s.onboarding_completed_at)}` : "Not completed"} /></Block>
    <Block title="Subscription"><Row label="Tier" value={<span className="capitalize">{typeof sub.tier === "string" ? sub.tier : "none"}</span>} /><Row label="Status" value={<span className="capitalize">{typeof sub.status === "string" ? sub.status : "—"}</span>} /><Row label="Renews / ends" value={fmtDate(typeof sub.current_period_end === "string" ? sub.current_period_end : null)} /><Row label="Trial ends" value={fmtDate(typeof sub.trial_end === "string" ? sub.trial_end : null)} /><Row label="Cancelled" value={fmtDate(typeof sub.canceled_at === "string" ? sub.canceled_at : null)} /><Row label="Stripe customer" value={<span className="font-mono text-xs">{typeof sub.stripe_customer_id === "string" ? sub.stripe_customer_id : "—"}</span>} /></Block>
    <Block title="Payments & revenue"><Row label="Charged (paid bookings)" value={money(detail.revenue.charged_total)} /><Row label="Platform fees earned" value={money(detail.revenue.platform_fees)} /><Separator className="my-2" /><Row label="Stripe account" value={<span className="font-mono text-xs">{typeof connect.stripe_account_id === "string" ? connect.stripe_account_id : "Not connected"}</span>} /><Row label="Charges enabled" value={connect.charges_enabled ? "Yes" : "No"} /><Row label="Payouts enabled" value={connect.payouts_enabled ? "Yes" : "No"} /><Row label="Environment" value={typeof connect.environment === "string" ? connect.environment : "—"} /></Block>
    <Block title={`Staff (${detail.employees.length})`}>{detail.employees.length === 0 ? <p className="text-sm text-muted-foreground">No staff added.</p> : <div className="divide-y divide-border">{detail.employees.map((e) => <div key={e.id} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="text-sm font-medium truncate">{e.name}</p><p className="text-xs text-muted-foreground truncate">{e.email}{e.position ? ` · ${e.position}` : ""}</p></div><Badge variant={e.linked ? "default" : "secondary"}>{e.linked ? "Joined" : "Invited"}</Badge></div>)}</div>}</Block>
    <Block title={`Services (${detail.services.length})`}>{detail.services.length === 0 ? <p className="text-sm text-muted-foreground">No services set up.</p> : <div className="divide-y divide-border">{detail.services.map((sv) => <div key={sv.id} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="text-sm truncate">{sv.name}</p><p className="text-xs text-muted-foreground">{sv.duration_minutes} min</p></div><div className="flex items-center gap-2"><span className="text-sm">{money(sv.price)}</span>{!sv.active && <Badge variant="secondary">Off</Badge>}</div></div>)}</div>}</Block>
    <Block title="Recent bookings">{detail.recent_bookings.length === 0 ? <p className="text-sm text-muted-foreground">No bookings yet.</p> : <div className="divide-y divide-border">{detail.recent_bookings.map((b) => <div key={b.id} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="text-sm truncate">{b.client_name} · {b.service}</p><p className="text-xs text-muted-foreground">{fmtDate(b.booking_date)} at {String(b.booking_time).slice(0, 5)}</p></div><div className="flex items-center gap-2 shrink-0"><span className="text-sm">{money(b.charge_amount)}</span><Badge variant="secondary" className="capitalize">{b.status}</Badge></div></div>)}</div>}</Block>
    <Block title="Reputation"><Row label="Average rating" value={detail.avg_rating ? `${detail.avg_rating} / 5` : "No reviews yet"} /><Row label="Reviews" value={detail.counts.reviews} /></Block><Block title="Account"><Row label="Owner user ID" value={<span className="font-mono text-[11px]">{userId}</span>} /><Row label="Joined" value={fmtDate(typeof detail.profile?.created_at === "string" ? detail.profile.created_at : null)} /></Block>
  </div>}</SheetContent></Sheet>;
}
