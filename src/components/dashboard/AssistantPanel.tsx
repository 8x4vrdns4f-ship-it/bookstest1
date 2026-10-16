import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Send, Check, X, Loader2, MessageSquareText, RotateCcw, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/sendEmail";

type Msg = { role: "user" | "assistant"; content: string };
type ChangeSet = Record<string, any> & { summary?: string; campaign?: { subject?: string; body?: string } | null };

export const OPEN_ASSISTANT_EVENT = "booksuite:open-assistant";
export const DATA_CHANGED_EVENT = "booksuite:data-changed";
export const openAssistant = () => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT));

const SUGGESTIONS: Record<string, string[]> = {
  "/dashboard/shifts": ["Who's working tomorrow?", "Give everyone Monday to Friday 9 to 5", "Any time-off requests waiting?"],
  "/dashboard/bookings": ["What's on tomorrow?", "Any pending requests?", "Confirm all pending requests for this week"],
  "/dashboard/calendar": ["How busy is next week?", "What's my busiest day this month?"],
  "/dashboard/clients": ["Who hasn't booked in 60 days?", "Add a client: Jake Smith, jake@email.com"],
  "/dashboard/campaigns": ["Write an email inviting clients back this month", "Draft a Christmas opening hours email"],
  "/dashboard/insights": ["What was my most popular service last month?", "How much did I make this month?"],
  "/settings": ["Open 9am to 6pm Mon–Sat, closed Sunday", "Add a service: skin fade, 30 minutes, £25"],
};
const DEFAULT_SUGGESTIONS = ["What's on today?", "How many bookings this week?", "Add a service: skin fade, 30 minutes, £25"];

export default function AssistantPanel() {
  const { toast } = useToast();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState<ChangeSet | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, h);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, h);
  }, []);

  const loadUsage = async () => {
    const { data } = await supabase.rpc("get_assistant_usage");
    const row = Array.isArray(data) ? data[0] : data;
    if (row) setUsage({ used: row.used, limit: row.monthly_limit });
  };
  useEffect(() => { if (open) { loadUsage(); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy, pending]);

  const readError = async (error: any, data: any) => {
    if (data?.error) return data.error as string;
    try { const b = await error?.context?.json(); if (b?.error) return b.error as string; } catch { /* ignore */ }
    return error?.message || "Please try again.";
  };

  const atLimit = !!usage && usage.limit > 0 && usage.used >= usage.limit;

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy || atLimit) return;
    setInput("");
    setPending(null);
    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("business-assistant", { body: { message: msg, history, page: pathname } });
    setBusy(false);
    inputRef.current?.focus();
    loadUsage();
    if (error || (data as any)?.error) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${await readError(error, data)}` }]);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: (data as any).reply }]);
    if ((data as any).change_set) setPending((data as any).change_set);
  };

  const apply = async () => {
    if (!pending) return;
    setApplying(true);
    const { data, error } = await supabase.functions.invoke("business-assistant", { body: { apply: true, change_set: pending } });
    if (error || (data as any)?.error) {
      setApplying(false);
      toast({ title: "Couldn't apply that", description: await readError(error, data), variant: "destructive" });
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    for (const e of (data as any).emails || []) await sendEmail(e.template, e.to, e.key, e.data, u.user?.id);
    setApplying(false);
    const sent = (data as any).campaign_sent;
    setPending(null);
    setMessages((m) => [...m, { role: "assistant", content: sent ? "Done — your email is on its way to your clients." : "Done — I've made those changes." }]);
    window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
    toast({ title: sent ? "Email sent" : "Changes applied" });
  };

  const suggestions = SUGGESTIONS[pathname] || DEFAULT_SUGGESTIONS;
  const isEmail = !!pending?.campaign;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        aria-label="Open assistant"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)]"
      >
        <MessageSquareText className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border text-left">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary font-extrabold text-sm">BS</span>
              <div className="min-w-0">
                <SheetTitle className="text-base">BookSuite assistant</SheetTitle>
                <SheetDescription className="text-xs">
                  Ask anything or tell me what to change. Nothing is saved until you press Apply.
                </SheetDescription>
              </div>
            </div>
            {usage && usage.limit > 0 && (
              <p className="text-xs text-muted-foreground pt-1">{Math.max(0, usage.limit - usage.used)} of {usage.limit} requests left this month</p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Try one of these:</p>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground hover:border-primary/50">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm whitespace-pre-wrap">{m.content}</div>
              ) : (
                <div key={i} className="text-sm text-foreground prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ),
            )}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Thinking…</div>
            )}
            {pending && (
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-3">
                {isEmail && (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm space-y-1">
                    <div className="font-semibold text-foreground">{pending.campaign?.subject}</div>
                    <div className="text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">{pending.campaign?.body}</div>
                    <div className="text-xs text-muted-foreground pt-1">Goes to all your clients with an email address.</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={apply} disabled={applying} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {applying ? <Loader2 size={14} className="mr-1 animate-spin" /> : isEmail ? <Mail size={14} className="mr-1" /> : <Check size={14} className="mr-1" />}
                    {isEmail ? "Send" : "Apply"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPending(null)} disabled={applying}><X size={14} className="mr-1" /> Cancel</Button>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-border p-3 flex items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder={atLimit ? "You've used this month's requests" : "e.g. Give Sam Friday off"}
              className="min-h-[44px] max-h-32 resize-none bg-background"
              disabled={atLimit}
            />
            <div className="flex flex-col gap-1">
              {messages.length > 0 && (
                <Button type="button" size="icon" variant="ghost" className="h-8 w-10" aria-label="New conversation" onClick={() => { setMessages([]); setPending(null); }}>
                  <RotateCcw size={14} />
                </Button>
              )}
              <Button type="submit" size="icon" aria-label="Send" disabled={busy || !input.trim() || atLimit} className="h-11 w-10 bg-primary text-primary-foreground hover:bg-primary/90">
                <Send size={16} />
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
