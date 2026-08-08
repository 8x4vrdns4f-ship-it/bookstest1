import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Users, Mail, Phone } from "lucide-react";

export interface RosterEmployee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  manual_status: string | null;
  manual_status_date: string | null;
}

interface Props {
  employees: RosterEmployee[];
  shiftEmployeeIds: Set<string>;
  date: string;
  onSelect: (id: string) => void;
}

const StaffRoster = ({ employees, shiftEmployeeIds, date, onSelect }: Props) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.email, e.position].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [employees, query]);

  const chipFor = (e: RosterEmployee) => {
    if (e.manual_status === "unavailable" && e.manual_status_date === date) {
      return { label: "Unavailable", cls: "text-destructive bg-destructive/10" };
    }
    if (shiftEmployeeIds.has(e.id)) {
      return { label: "On shift", cls: "text-emerald-400 bg-emerald-400/10" };
    }
    return { label: "No shift", cls: "text-muted-foreground bg-muted/30" };
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

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No team members match your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const chip = chipFor(e);
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e.id)}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/10 hover:border-border hover:bg-muted/25 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                </div>
                <span className={`shrink-0 text-[10px] uppercase tracking-[0.08em] font-semibold px-2 py-1 rounded-full ${chip.cls}`}>
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffRoster;
