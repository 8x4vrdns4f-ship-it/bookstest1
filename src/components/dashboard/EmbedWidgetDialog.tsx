import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Copy, Download, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildWidgetHtml } from "@/lib/widgetTemplate";
import { supabase } from "@/integrations/supabase/client";

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

  const origin =
    typeof window !== "undefined"
      ? window.location.origin.includes("lovable.app") || window.location.origin.includes("localhost")
        ? window.location.origin
        : "https://booksuite.online"
      : "https://booksuite.online";

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

        <Tabs defaultValue="script" className="mt-2">
          <TabsList className="bg-secondary">
            <TabsTrigger value="script">Script tag</TabsTrigger>
            <TabsTrigger value="iframe">iframe</TabsTrigger>
            <TabsTrigger value="link">Direct link</TabsTrigger>
            <TabsTrigger value="download">Download HTML</TabsTrigger>
          </TabsList>

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
