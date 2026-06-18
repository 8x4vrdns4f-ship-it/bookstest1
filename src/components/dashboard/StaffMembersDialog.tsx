import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  tierName: string;
  limit: number | null;
  count: number;
}

interface Row {
  id: string;
  name: string;
  email: string;
  position: string | null;
}

const StaffMembersDialog = ({ open, onOpenChange, userId, tierName, limit, count }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("employees")
      .select("id, name, email, position")
      .eq("user_id", userId)
      .order("name")
      .then(({ data }) => {
        setRows((data as Row[]) || []);
        setLoading(false);
      });
  }, [open, userId]);

  const remaining = limit === null ? "∞" : Math.max(0, limit - count);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Users size={18} className="text-primary" /> Staff members
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You're using <span className="text-foreground font-medium">{count}</span> of{" "}
            <span className="text-foreground font-medium">{limit ?? "∞"}</span> staff slots on your{" "}
            <span className="text-foreground font-medium">{tierName}</span> plan.
            {limit !== null && (
              <> {remaining} slot{remaining === 1 ? "" : "s"} remaining.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground text-sm py-4">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No staff yet. Add your first team member from the Staff tab.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded border border-border bg-secondary/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.position || r.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button asChild variant="outline" className="border-border">
            <Link to="/pricing"><Sparkles size={14} className="mr-1.5" /> View plans</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffMembersDialog;
