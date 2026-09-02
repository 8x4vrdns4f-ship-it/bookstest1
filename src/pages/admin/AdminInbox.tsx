import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MailCheck, MailOpen, RefreshCw } from "lucide-react";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  created_at: string;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load inbox", description: error.message, variant: "destructive" });
    } else {
      setMessages((data as Message[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markHandled = async (msg: Message) => {
    const { error } = await supabase.from("contact_messages").update({ handled: !msg.handled }).eq("id", msg.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      const updated = { ...msg, handled: !msg.handled };
      setMessages((items) => items.map((item) => item.id === msg.id ? updated : item));
      setSelected((item) => item?.id === msg.id ? updated : item);
      toast({ title: updated.handled ? "Marked handled" : "Message reopened" });
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading inbox…</p>;

  const open = messages.filter((m) => !m.handled).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{messages.length} message{messages.length === 1 ? "" : "s"} · {open} awaiting a reply</p>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1.5" /> Refresh</Button>
      </div>
      {messages.length === 0 ? (
        <SectionCard><p className="text-sm text-muted-foreground">No contact messages yet.</p></SectionCard>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <button key={m.id} type="button" onClick={() => setSelected(m)} className="w-full text-left">
              <SectionCard tone={m.handled ? "default" : "warning"} className="transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{m.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.name} · {m.email} · {fmtDate(m.created_at)}</p>
                    <p className="text-sm mt-3 line-clamp-2 text-muted-foreground">{m.message}</p>
                  </div>
                  <Badge variant={m.handled ? "secondary" : "default"}>{m.handled ? "Handled" : "Open"}</Badge>
                </div>
              </SectionCard>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject}</DialogTitle>
                <DialogDescription>{selected.name} · {selected.email} · {fmtDate(selected.created_at)}</DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm whitespace-pre-wrap leading-6 max-h-[45vh] overflow-y-auto">
                {selected.message}
              </div>
              <DialogFooter>
                <Button variant="outline" asChild><a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}><MailOpen className="h-4 w-4 mr-1.5" /> Reply by email</a></Button>
                <Button variant={selected.handled ? "ghost" : "default"} onClick={() => markHandled(selected)}>
                  {selected.handled ? <MailOpen className="h-4 w-4 mr-1.5" /> : <MailCheck className="h-4 w-4 mr-1.5" />}
                  {selected.handled ? "Reopen" : "Mark handled"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
