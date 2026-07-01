import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppDialog } from "@/components/app/AppDialog";
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
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Users}
      title="Staff members"
      description={
        <>
          You're using <span className="text-foreground font-medium">{count}</span> of{" "}
          <span className="text-foreground font-medium">{limit ?? "∞"}</span> staff slots on your{" "}
          <span className="text-foreground font-medium">{tierName}</span> plan.
          {limit !== null && (
            <> {remaining} slot{remaining === 1 ? "" : "s"} remaining.</>
          )}
        </>
      }
      contentClassName="max-h-[60vh] overflow-y-auto"
      footer={
        <Button asChild variant="premium">
          <Link to="/pricing">
            <Sparkles size={14} className="mr-1.5" /> View plans
          </Link>
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted-foreground text-sm py-2">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm py-2">
          No staff yet. Add your first team member from the Staff tab.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3 transition hover:bg-secondary/60"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.position || r.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppDialog>
  );
};

export default StaffMembersDialog;
