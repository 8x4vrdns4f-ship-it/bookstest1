import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Users, Mail, Phone, Send, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildInviteUrl, sendEmployeeInvite } from "@/lib/employeeInvite";

export interface RosterEmployee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  manual_status: string | null;
  manual_status_date: string | null;
  auth_user_id?: string | null;
}

interface Props {
  employees: RosterEmployee[];
  shiftEmployeeIds: Set<string>;
  date: string;
  onSelect: (id: string) => void;
  business?: { name: string; code: string } | null;
}

const StaffRoster = ({ employees, shiftEmployeeIds, date, onSelect, business }: Props) => {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.email, e.position].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [employees, query]);

  const chipFor = (e: RosterEmployee) => {
    if (!e.auth_user_id) return { label: "Invited", cls: "text-amber-400 bg-amber-400/10" };
    if (e.manual_status === "unavailable" && e.manual_status_date === date) {
      return { label: "Unavailable", cls: "text-destructive bg-destructive/10" };
    }
    if (shiftEmployeeIds.has(e.id)) {
      return { label: "On shift", cls: "text-emerald-400 bg-emerald-400/10" };
    }
    return { label: "Active", cls: "text-muted-foreground bg-muted/30" };
  };

  const resend = async (e: RosterEmployee) => {
    if (!business?.code) return;
    setBusyId(e.id);
    try {
      await sendEmployeeInvite({
        employeeId: e.id,
        name: e.name,
        email: e.email,
        businessName: business.name,
        companyCode: business.code,
      });
      toast({ title: "Invite resent", description: `Sent to ${e.email}.` });
    } catch {
      toast({ title: "Couldn't resend", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async (e: RosterEmployee) => {
    if (!business?.code) return;
    try {
      await navigator.clipboard.writeText(buildInviteUrl(business.code, e.email));
      toast({ title: "Invite link copied" });
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-[20px] bg-card border border-border p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h3 className="font-semibold text-foreground text-[15px] tracking-tight">All team members</h3>
          <span className="text-xs text-muted-foreground">({employees.length})</span>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or role"
          className="sm:w-64"
        />
      </div>

      {business?.code && (
        <p className="text-xs text-muted-foreground">
          Company code <span className="font-mono text-foreground">{business.code}</span> — staff can also join manually with this.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No team members match your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const chip = chipFor(e);
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/10 hover:border-border transition-colors"
              >
                <button onClick={() => onSelect(e.id)} className="flex items-center gap-3 min-w-0 text-left flex-1">
                  <div className="w-9 h-9 rounded-full bg-primary/[0.12] text-primary flex items-center justify-center shrink-0 text-sm font-semibold uppercase">
                    {e.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
                      {e.position && <span className="truncate">{e.position}</span>}
                      {e.email && (
                        <span className="hidden sm:flex items-center gap-1 truncate">
                          <Mail size={11} /> {e.email}
                        </span>
                      )}
                      {e.phone && (
                        <span className="hidden md:flex items-center gap-1 truncate">
                          <Phone size={11} /> {e.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {!e.auth_user_id && business?.code && (
                    <>
                      <button
                        onClick={() => copyLink(e)}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/40"
                        aria-label={`Copy invite link for ${e.name}`}
                        title="Copy invite link"
                      >
                        <Link2 size={14} />
                      </button>
                      <button
                        onClick={() => resend(e)}
                        disabled={busyId === e.id}
                        className="text-primary hover:text-primary/80 p-1.5 rounded-lg hover:bg-primary/10 disabled:opacity-50"
                        aria-label={`Resend invite to ${e.name}`}
                        title="Resend invite"
                      >
                        <Send size={14} />
                      </button>
                    </>
                  )}
                  <span className={`text-[10px] uppercase tracking-[0.08em] font-semibold px-2 py-1 rounded-full ${chip.cls}`}>
                    {chip.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffRoster;
