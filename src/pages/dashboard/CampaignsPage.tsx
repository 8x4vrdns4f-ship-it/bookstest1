import { useEffect, useState } from "react";
import { Megaphone, Plus, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useSubscription } from "@/hooks/useSubscription";
import { TIER_LIMITS } from "@/lib/tierLimits";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/app/PageHeader";
import SectionCard from "@/components/app/SectionCard";
import EmptyState from "@/components/app/EmptyState";
import SEO from "@/components/SEO";
import LockedFeature from "@/components/LockedFeature";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

type Campaign = {
  id: string;
  subject: string;
  body: string;
  status: "draft" | "sending" | "sent" | "failed";
  audience_count: number | null;
  sent_count: number;
  sent_at: string | null;
  created_at: string;
};

const statusBadge = (c: Campaign) => {
  if (c.status === "sent") return <Badge>Sent</Badge>;
  if (c.status === "sending") return <Badge variant="secondary">Sending…</Badge>;
  if (c.status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">Draft</Badge>;
};

export default function CampaignsPage() {
  const { businessUserId } = useDashboardContext();
  const { tier, loading: subLoading } = useSubscription();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const canCampaigns = tier ? TIER_LIMITS[tier].campaigns : false;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("campaigns")
      .select("id, subject, body, status, audience_count, sent_count, sent_at, created_at")
      .eq("user_id", businessUserId)
      .order("created_at", { ascending: false })
      .limit(50);
    setCampaigns((data as Campaign[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (businessUserId && canCampaigns) load();
  }, [businessUserId, canCampaigns]);

  const createAndSend = async () => {
    const s = subject.trim();
    const b = body.trim();
    if (s.length < 3 || s.length > 140) {
      toast({ title: "Subject must be 3–140 characters", variant: "destructive" }); return;
    }
    if (b.length < 10 || b.length > 5000) {
      toast({ title: "Message must be 10–5000 characters", variant: "destructive" }); return;
    }
    setSending(true);
    try {
      const { data: created, error } = await supabase
        .from("campaigns")
        .insert({ user_id: businessUserId, subject: s, body: b } as never)
        .select("id")
        .single();
      if (error || !created) throw new Error(error?.message || "Could not create campaign");

      const { error: fnErr } = await supabase.functions.invoke("send-campaign", {
        body: { campaign_id: (created as { id: string }).id },
      });
      if (fnErr) {
        const msg = (fnErr as { context?: { text?: () => Promise<string> } }).context
          ? await (fnErr as any).context.text().catch(() => fnErr.message)
          : fnErr.message;
        throw new Error(msg || "Send failed");
      }
      toast({ title: "Campaign sent", description: "Your email is on its way to your clients." });
      setOpen(false);
      setSubject(""); setBody("");
      load();
    } catch (e) {
      toast({
        title: "Campaign failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
      load();
    } finally {
      setSending(false);
    }
  };

  if (subLoading) {
    return <div className="py-24 text-center text-muted-foreground">Loading…</div>;
  }

  if (!canCampaigns) {
    return (
      <>
        <SEO title="Campaigns — BookSuite" description="Email your clients with offers and updates." path="/dashboard/campaigns" noIndex />
        <PageHeader title="Campaigns" description="Email your clients with offers and updates." />
        <LockedFeature
          requiredTier="gold"
          title="Email campaigns"
          description="Send offers and updates to everyone who's booked with you. Available on Gold and Platinum."
        >
          <div className="h-64" />
        </LockedFeature>
      </>
    );
  }

  return (
    <>
      <SEO title="Campaigns — BookSuite" description="Email your clients with offers and updates." path="/dashboard/campaigns" noIndex />
      <PageHeader
        title="Campaigns"
        description="Email everyone who's booked with you — offers, news, seasonal updates."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} className="mr-1.5" /> New campaign
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={24} />}
          title="No campaigns yet"
          description="Send your first campaign to bring clients back — a seasonal offer or a simple 'we miss you' works well."
          action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-1.5" /> New campaign</Button>}
        />
      ) : (
        <SectionCard title="History" icon={<Megaphone size={18} />}>
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-lg border border-border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground truncate">{c.subject}</span>
                  {statusBadge(c)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.body}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} /> {c.sent_count}{c.audience_count ? ` of ${c.audience_count}` : ""} clients
                  </span>
                  {c.sent_at && <span>{new Date(c.sent_at).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New campaign</DialogTitle>
            <DialogDescription>
              Sent to clients from your bookings and client list, excluding anyone who has unsubscribed.
              Use {"{name}"} to personalise with the client's name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="camp-subject">Subject</Label>
              <Input
                id="camp-subject" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Summer offer: 20% off this week" maxLength={140} className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="camp-body">Message</Label>
              <Textarea
                id="camp-body" value={body} onChange={(e) => setBody(e.target.value)}
                placeholder={"Hi {name},\n\nBook any appointment this week and save 20%.\n\nSee you soon!"}
                rows={7} maxLength={5000} className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>Cancel</Button>
            <Button onClick={createAndSend} disabled={sending}>
              <Send size={14} className="mr-1.5" />
              {sending ? "Sending…" : "Send campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
