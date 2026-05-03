import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Phone, CheckCircle2, Clock } from "lucide-react";
import AddEmployeeDialog from "./AddEmployeeDialog";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  auth_user_id: string | null;
}

const StaffList = ({ userId }: { userId: string }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, email, phone, position, auth_user_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setEmployees(data as Employee[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your team?`)) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to remove employee.", variant: "destructive" });
      return;
    }
    toast({ title: "Removed", description: `${name} has been removed.` });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your Team</h2>
          <p className="text-sm text-muted-foreground">Add staff and let them join with your company code.</p>
        </div>
        <AddEmployeeDialog userId={userId} onEmployeeAdded={load} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : employees.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No staff yet. Add your first team member to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {employees.map((e) => (
            <Card key={e.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{e.name}</h3>
                      {e.auth_user_id ? (
                        <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                          <CheckCircle2 size={12} /> Linked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-border text-muted-foreground">
                          <Clock size={12} /> Pending join
                        </Badge>
                      )}
                    </div>
                    {e.position && <p className="text-sm text-muted-foreground mt-0.5">{e.position}</p>}
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Mail size={14} /> {e.email}</div>
                      {e.phone && <div className="flex items-center gap-2"><Phone size={14} /> {e.phone}</div>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(e.id, e.name)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffList;
