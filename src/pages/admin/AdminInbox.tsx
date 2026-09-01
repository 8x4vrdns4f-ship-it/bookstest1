import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/app/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MailCheck, MailOpen } from "lucide-react";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  created_at: string;
};

export default function AdminInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
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
    const { error } = await supabase
      .from("contact_messages")
      .update({ handled: !msg.handled })
      .eq("id", msg.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, handled: !msg.handled } : x)));
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading inbox…</p>;

  const open = messages.filter((m) => !m.handled).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {messages.length} message{messages.length === 1 ? "" : "s"} · {open} awaiting a reply
      </p>
      {messages.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-muted-foreground">No contact messages yet.</p>
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <SectionCard key={m.id} tone={m.handled ? "default" : "warning"}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{m.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.name} · {m.email} ·{" "}
                    {new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-sm mt-3 whitespace-pre-wrap">{m.message}</p>
                </div>
                <Button size="sm" variant={m.handled ? "ghost" : "outline"} onClick={() => markHandled(m)}>
                  {m.handled ? <MailOpen className="h-4 w-4 mr-1.5" /> : <MailCheck className="h-4 w-4 mr-1.5" />}
                  {m.handled ? "Reopen" : "Mark handled"}
                </Button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
