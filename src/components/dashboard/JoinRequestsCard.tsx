import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, X, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type JoinRequest = {
  id: string;
  user_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  status: string;
  created_at: string;
};

type Role = { id: string; name: string; is_builtin: boolean };

const JoinRequestsCard = ({ businessUserId }: { businessUserId: string }) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [acceptOpen, setAcceptOpen] = useState<JoinRequest | null>(null);
  const [declineOpen, setDeclineOpen] = useState<JoinRequest | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [rq, rl] = await Promise.all([
      supabase
        .from("employee_join_requests")
        .select("id, user_id, requester_name, requester_email, requester_phone, status, created_at")
        .eq("user_id", businessUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("company_roles")
        .select("id, name, is_builtin")
        .eq("user_id", businessUserId)
        .order("is_builtin", { ascending: false })
        .order("name"),
    ]);
    setRequests((rq.data || []) as JoinRequest[]);
    setRoles((rl.data || []) as Role[]);
  }, [businessUserId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`join-requests-${businessUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_join_requests", filter: `user_id=eq.${businessUserId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessUserId, load]);

  const accept = async () => {
    if (!acceptOpen || !selectedRole) return;
    setBusy(true);
    const { error } = await supabase.rpc("decide_join_request", {
      p_request_id: acceptOpen.id,
      p_decision: "accept",
      p_role_id: selectedRole,
      p_decline_reason: null,
    });
    setBusy(false);
    if (error) { toast({ title: "Could not accept", description: error.message, variant: "destructive" }); return; }
    const roleName = roles.find((r) => r.id === selectedRole)?.name || "team member";
    const { data: bs } = await supabase.from("business_settings").select("business_name").eq("user_id", businessUserId).maybeSingle();
    const { sendEmail } = await import("@/lib/sendEmail");
    sendEmail("join-request-approved", acceptOpen.requester_email, `join-approve-${acceptOpen.id}`, {
      applicantName: acceptOpen.requester_name,
      businessName: bs?.business_name || "the team",
      role: roleName,
      loginUrl: `${window.location.origin}/auth`,
    });
    toast({ title: `${acceptOpen.requester_name} accepted` });
    setAcceptOpen(null); setSelectedRole(""); load();
  };

  const decline = async () => {
    if (!declineOpen || !reason.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("decide_join_request", {
      p_request_id: declineOpen.id,
      p_decision: "decline",
      p_role_id: null,
      p_decline_reason: reason.trim(),
    });
    setBusy(false);
    if (error) { toast({ title: "Could not decline", description: error.message, variant: "destructive" }); return; }
    const { data: bs } = await supabase.from("business_settings").select("business_name").eq("user_id", businessUserId).maybeSingle();
    const { sendEmail } = await import("@/lib/sendEmail");
    sendEmail("join-request-declined", declineOpen.requester_email, `join-decline-${declineOpen.id}`, {
      applicantName: declineOpen.requester_name,
      businessName: bs?.business_name || "the team",
      reason: reason.trim(),
    });
    toast({ title: "Request declined" });
    setDeclineOpen(null); setReason(""); load();
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <UserPlus size={18} className="text-primary" /> Join Requests
            {requests.length > 0 && (
              <Badge className="ml-1 bg-primary text-primary-foreground"><Bell size={12} className="mr-1" />{requests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending join requests.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-md bg-secondary/40 border border-border">
                  <div>
                    <p className="text-foreground font-medium">{r.requester_name}</p>
                    <p className="text-xs text-muted-foreground">{r.requester_email}{r.requester_phone ? ` · ${r.requester_phone}` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setAcceptOpen(r)} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                      <Check size={14} /> Accept
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeclineOpen(r)} className="gap-1">
                      <X size={14} /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept dialog */}
      <Dialog open={!!acceptOpen} onOpenChange={(v) => { if (!v) { setAcceptOpen(null); setSelectedRole(""); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Accept {acceptOpen?.requester_name}</DialogTitle>
            <DialogDescription>Choose the role to assign them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="capitalize">
                    {r.name}{r.is_builtin ? "" : " (custom)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptOpen(null)}>Cancel</Button>
            <Button onClick={accept} disabled={!selectedRole || busy} className="bg-green-600 hover:bg-green-700 text-white">
              {busy ? "Accepting…" : "Confirm Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline dialog */}
      <Dialog open={!!declineOpen} onOpenChange={(v) => { if (!v) { setDeclineOpen(null); setReason(""); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Decline {declineOpen?.requester_name}</DialogTitle>
            <DialogDescription>Tell them why. They'll see this on their pending page (and in their email once email is wired up).</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. We're not hiring right now." className="bg-secondary border-border min-h-[100px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={decline} disabled={!reason.trim() || busy}>
              {busy ? "Declining…" : "Submit Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinRequestsCard;
