import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { handleTierError } from "@/lib/tierError";
import { AppDialog } from "@/components/app/AppDialog";
import { UserPlus } from "lucide-react";
import { sendEmployeeInvite } from "@/lib/employeeInvite";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeForm } from "@/lib/formSchemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AddEmployeeDialogProps {
  userId: string;
  onEmployeeAdded?: () => void;
}

const AddEmployeeDialog = ({ userId, onEmployeeAdded }: AddEmployeeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [roleId, setRoleId] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: "", email: "", phone: "", position: "" },
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("company_roles")
        .select("id, name")
        .eq("user_id", userId)
        .neq("name", "owner")
        .order("name");
      const list = data || [];
      setRoles(list);
      setRoleId((prev) => prev || list.find((r) => r.name === "employee")?.id || list[0]?.id || "");
    })();
  }, [open, userId]);

  const onSubmit = async (values: EmployeeForm) => {
    setLoading(true);
    const { data: emp, error } = await supabase.from("employees").insert({
      user_id: userId,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || null,
      position: values.position?.trim() || null,
      role_id: roleId || null,
    }).select("id").single();
    setLoading(false);

    if (error) {
      if (!handleTierError(error))
        toast({ title: "Error", description: "Failed to add employee.", variant: "destructive" });
      return;
    }

    try {
      const { data: bs } = await supabase
        .from("business_settings")
        .select("business_name, company_code")
        .eq("user_id", userId)
        .maybeSingle();
      if (bs?.company_code && values.email.trim()) {
        await sendEmployeeInvite({
          employeeId: emp?.id,
          name: values.name.trim(),
          email: values.email.trim(),
          businessName: bs.business_name || "the team",
          companyCode: bs.company_code,
        });
      }
    } catch (e) { console.error("invite email failed", e); }

    toast({
      title: "Invite sent",
      description: `${values.name} can now accept the invite from their email — no approval needed.`,
    });
    form.reset();
    setOpen(false);
    onEmployeeAdded?.();
  };


  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
      >
        <UserPlus size={16} />
        Add Employee
      </Button>
      <AppDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) form.reset(); }}
        title="Add Team Member"
        description="Add an employee to your team so they can help manage bookings."
        icon={UserPlus}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {loading ? "Adding..." : "Add Employee"}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} className="bg-secondary border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@company.com" {...field} className="bg-secondary border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1 234 567 8900" {...field} className="bg-secondary border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position / Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Stylist, Receptionist" {...field} className="bg-secondary border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>Access level</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="capitalize">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Managers and receptionists get the full dashboard; employees see their own schedule.
              </p>
            </div>
          </form>
        </Form>
      </AppDialog>
    </>
  );
};

export default AddEmployeeDialog;
