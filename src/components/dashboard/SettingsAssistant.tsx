import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };
type ChangeSet = {
  settings_patch?: Record<string, unknown>;
  resource_ops?: any[];
  service_ops?: any[];
  summary?: string;
};

const EXAMPLES = [
  "Open 8am to 8pm Mon–Fri, closed Sunday",
  "Add a table called Window 2 that seats 4",
  "Set the deposit to £15 and turn on auto-confirm",
];

export default function SettingsAssistant({ onApplied }: { onApplied: () => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState<ChangeSet | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput("");
    setPending(null);
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("settings-assistant", {
      body: { message: msg, history },
    });
    setBusy(false);
    inputRef.current?.focus();

    const err = (data as any)?.error;
    if (error || err) {
      const description = err || error?.message || "Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: description }]);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: (data as any).reply }]);
    if ((data as any).change_set) setPending((data as any).change_set as ChangeSet);
  };

  const apply = async () => {
    if (!pending) return;
    setApplying(true);
    const { data, error } = await supabase.functions.invoke("settings-assistant", {
      body: { apply: true, change_set: pending },
    });
    setApplying(false);
    const err = (data as any)?.error;
    if (error || err) {
      toast({ title: "Couldn't apply that", description: err || error?.message, variant: "destructive" });
      return;
    }
    setPending(null);
    setMessages((m) => [...m, { role: "assistant", content: "Done — I've made those changes." }]);
    onApplied();
    toast({ title: "Changes applied" });
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
          <Sparkles size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground leading-tight">Ask to change anything</h2>
          <p className="text-xs text-muted-foreground">Describe what you want and I'll set it up for you.</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => send(e)}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-muted-foreground hover:text-foreground"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "text-sm text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 ml-auto max-w-[85%] w-fit"
                  : "text-sm text-muted-foreground max-w-[95%]"
              }
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </div>
          )}
        </div>
      )}

      {pending && (
        <div className="mb-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <p className="text-sm text-foreground mb-3">{pending.summary}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={apply} disabled={applying} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {applying ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />} Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)} disabled={applying}>
              <X size={14} className="mr-1" /> Cancel
            </Button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Add a service: skin fade, 30 minutes, £25"
          className="bg-background border-border"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
