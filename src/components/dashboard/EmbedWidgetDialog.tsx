import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Copy, Download, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildWidgetHtml } from "@/lib/widgetTemplate";
import { getStripeEnvironment } from "@/lib/connectPayments";
import { supabase } from "@/integrations/supabase/client";
import { publicOrigin } from "@/lib/publicUrl";

type Props = { userId: string; trigger: React.ReactNode };

const EmbedWidgetDialog = ({ userId, trigger }: Props) => {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [aiRequest, setAiRequest] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<null | {
    method: string;
    platform: string;
    placement_summary: string;
    snippet: string;
    steps: string[];
    notes?: string;
  }>(null);

  type Tier = "silver" | "gold" | "platinum";
  const TIER_LABEL: Record<Tier, string> = {
    silver: "Silver plan · 1 AI request per month",
    gold: "Gold plan · 1 AI request per week",
    platinum: "Platinum plan · 1 AI request per 24 hours",
  };

  const [tier, setTier] = useState<Tier | null>(null);
  const [nextAvailableAt, setNextAvailableAt] = useState<Date | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const computeNext = (t: Tier, last: Date): Date => {
    if (t === "silver") {
      return new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1));
    }
    if (t === "gold") return new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date(last.getTime() + 24 * 60 * 60 * 1000);
  };
  const windowStart = (t: Tier): Date => {
    const now = new Date();
    if (t === "silver") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (t === "gold") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setUsageLoading(true);
      try {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("tier, subscribed, current_period_end")
          .eq("user_id", userId)
          .eq("subscribed", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const activeTier =
          sub &&
          (sub.current_period_end == null || new Date(sub.current_period_end) > new Date())
            ? ((sub.tier as Tier) ?? null)
            : null;
        if (cancelled) return;
        setTier(activeTier);
        if (!activeTier) {
          setNextAvailableAt(null);
          return;
        }
        const since = windowStart(activeTier);
        const { data: rows } = await supabase
          .from("embed_assistant_usage")
          .select("created_at")
          .eq("user_id", userId)
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        if (cancelled) return;
        if (rows && rows.length > 0) {
          setNextAvailableAt(computeNext(activeTier, new Date(rows[0].created_at)));
        } else {
          setNextAvailableAt(null);
        }
      } finally {
        if (!cancelled) setUsageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId, aiResult]);

  const overLimit = !!nextAvailableAt && nextAvailableAt > new Date();
  const formatNext = (d: Date) =>
    d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  const origin = publicOrigin();

  const scriptSnippet = `<div id="booksuite-widget"></div>\n<script src="${origin}/embed.js" data-user="${userId}"></script>`;
  const iframeSnippet = `<iframe src="${origin}/embed/${userId}" style="border:none;width:100%;max-width:500px;height:760px" title="Book an appointment"></iframe>`;
  const linkSnippet = `${origin}/book/${userId}`;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast({ title: "Copied!", description: "Paste it into your site." });
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast({ title: "Copy failed", description: "Select the text and copy manually.", variant: "destructive" });
    }
  };

  const downloadHtml = () => {
    const html = buildWidgetHtml({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      userId,
      paymentEnvironment: getStripeEnvironment(),
      stripePublishableKey: String(import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN || ""),
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "booking-calendar-widget.html";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Upload the HTML file to your site." });
  };

  const SnippetBox = ({ text, copyKey }: { text: string; copyKey: string }) => (
    <div className="relative">
      <pre className="text-xs bg-secondary border border-border rounded-md p-3 pr-12 overflow-x-auto text-foreground whitespace-pre-wrap break-all">
        {text}
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1.5 right-1.5 h-7 w-7"
        onClick={() => copy(text, copyKey)}
      >
        {copiedKey === copyKey ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Embed your booking widget</DialogTitle>
          <DialogDescription>
            Pick the method that works best for your website. The widget updates automatically — no need to re-paste when you change settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="mt-2">
          <TabsList className="bg-secondary flex-wrap h-auto">
            <TabsTrigger value="ai" className="gap-1.5"><Sparkles size={14} /> Ask AI</TabsTrigger>
            <TabsTrigger value="script">Script tag</TabsTrigger>
            <TabsTrigger value="iframe">iframe</TabsTrigger>
            <TabsTrigger value="link">Direct link</TabsTrigger>
            <TabsTrigger value="download">Download HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Describe where you want the widget. For example:&nbsp;
              <span className="italic text-foreground/80">"Centred in the middle of my Squarespace homepage under the hero, max 480px wide."</span>
              &nbsp;The AI will generate the exact code and step-by-step instructions.
            </p>

            <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs">
              {usageLoading ? (
                <span className="text-muted-foreground">Checking your plan…</span>
              ) : !tier ? (
                <span className="text-muted-foreground">
                  Subscribe to use the embed AI assistant.
                </span>
              ) : overLimit ? (
                <span className="text-muted-foreground">
                  {TIER_LABEL[tier]} · Next available{" "}
                  <span className="text-foreground font-medium">
                    {formatNext(nextAvailableAt!)}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {TIER_LABEL[tier]} · Ready to use
                </span>
              )}
            </div>

            <Textarea
              value={aiRequest}
              onChange={(e) => setAiRequest(e.target.value)}
              placeholder="e.g. I want it on my WordPress homepage, centred, below the welcome banner, with a heading that says 'Book now'."
              rows={3}
              className="bg-secondary border-border"
              disabled={!tier || overLimit}
            />
            <Button
              onClick={async () => {
                if (!aiRequest.trim()) return;
                setAiLoading(true);
                setAiResult(null);
                try {
                  const { data, error } = await supabase.functions.invoke("embed-assistant", {
                    body: { userId, request: aiRequest, origin },
                  });
                  if (error) {
                    let msg = error.message || "Could not generate";
                    try {
                      const ctx: any = (error as any).context;
                      if (ctx && typeof ctx.json === "function") {
                        const body = await ctx.json();
                        if (body?.error) msg = body.error;
                        if (body?.next_available_at) {
                          setNextAvailableAt(new Date(body.next_available_at));
                        }
                        if (body?.tier) setTier(body.tier as Tier);
                      }
                    } catch {}
                    throw new Error(msg);
                  }
                  if ((data as any)?.error) throw new Error((data as any).error);
                  setAiResult(data as any);
                } catch (e: any) {
                  toast({ title: "Could not generate", description: e?.message ?? "Try again.", variant: "destructive" });
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading || !aiRequest.trim() || !tier || overLimit}
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {aiLoading ? "Generating…" : "Generate code"}
            </Button>

            {aiResult && (
              <div className="mt-4 space-y-3 rounded-md border border-border bg-secondary/40 p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  {aiResult.platform} · {aiResult.method}
                </div>
                <p className="text-sm text-foreground">{aiResult.placement_summary}</p>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Paste this:</div>
                  <SnippetBox text={aiResult.snippet} copyKey="ai-snippet" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Steps:</div>
                  <ol className="list-decimal list-inside text-sm text-foreground space-y-1">
                    {aiResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
                {aiResult.notes && (
                  <p className="text-xs text-muted-foreground italic">{aiResult.notes}</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="script" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Recommended. Paste this once into a custom HTML / code block on your site. You'll always get the latest version.
            </p>
            <SnippetBox text={scriptSnippet} copyKey="script" />
          </TabsContent>

          <TabsContent value="iframe" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use this if your site builder blocks `&lt;script&gt;` tags (e.g. some Wix / Squarespace free tiers).
            </p>
            <SnippetBox text={iframeSnippet} copyKey="iframe" />
          </TabsContent>

          <TabsContent value="link" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A standalone booking page. Put it behind any "Book Now" button, or share it on Instagram, WhatsApp, email signatures, QR codes…
            </p>
            <SnippetBox text={linkSnippet} copyKey="link" />
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={linkSnippet} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Open page
              </a>
            </Button>
          </TabsContent>

          <TabsContent value="download" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Advanced: download a fully self-contained HTML file. Useful if you want to host it yourself or tweak the code.
            </p>
            <Button onClick={downloadHtml} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Download size={16} /> Download widget HTML
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">Live preview</h4>
          <div className="rounded-md border border-border bg-secondary/50 overflow-hidden">
            <iframe
              title="Widget preview"
              src={`${origin}/embed/${userId}`}
              style={{ border: "none", width: "100%", height: 540, background: "transparent" }}
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">How to add it to your site</h4>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="wix">
              <AccordionTrigger>Wix</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1">
                <p>1. Edit your page → click "+ Add" → Embed → Embed HTML.</p>
                <p>2. Choose "Code" and paste the script-tag snippet.</p>
                <p>3. Click "Update", then publish.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="squarespace">
              <AccordionTrigger>Squarespace</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1">
                <p>1. Edit the page → click an insert point → add a "Code" block.</p>
                <p>2. Paste the script-tag (or iframe) snippet. Disable "Display Source".</p>
                <p>3. Save and publish.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shopify">
              <AccordionTrigger>Shopify</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1">
                <p>1. Online Store → Pages → Add page (or edit one).</p>
                <p>2. Click the "&lt;&gt;" icon in the editor and paste the script-tag snippet.</p>
                <p>3. Save.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="wordpress">
              <AccordionTrigger>WordPress</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1">
                <p>1. Edit the page in the block editor.</p>
                <p>2. Add a "Custom HTML" block and paste the script-tag snippet.</p>
                <p>3. Update / Publish.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="webflow">
              <AccordionTrigger>Webflow</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1">
                <p>1. Drag an "Embed" element onto the page.</p>
                <p>2. Paste the script-tag snippet, click "Save & Close".</p>
                <p>3. Publish.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="plain">
              <AccordionTrigger>Plain HTML / other</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1">
                <p>Paste the script-tag snippet anywhere inside your page's `&lt;body&gt;`. That's it.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmbedWidgetDialog;
