import { useEffect, useState } from "react";
import { Mail, Send, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/sendEmail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SectionCard from "@/components/app/SectionCard";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FROM_DOMAIN = "booksuite.online";
const SUPPORT_EMAIL = "help@booksuite.online";

/** Mirrors the server-side rules in supabase/functions/_shared/sender-identity.ts. */
const RESERVED = new Set([
  "noreply", "no-reply", "postmaster", "abuse", "admin", "root", "support", "help",
  "mailer-daemon", "daemon", "bounce", "bounces", "feedback", "unsubscribe",
  "security", "webmaster", "owner", "hostmaster", "booksuite", "lovable",
]);

function isValidLocalPart(value: string): boolean {
  if (!/^[a-z0-9](?:[a-z0-9._-]{1,38}[a-z0-9])$/.test(value)) return false;
  if (value.includes("..") || value.includes("--")) return false;
  return !RESERVED.has(value);
}

function slugToLocalPart(name: string): string {
  const base = (name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 32)
    .replace(/-+$/g, "");
  const safe = base.length >= 3 ? base : base ? `${base}-booking` : "booking";
  return RESERVED.has(safe) ? `${safe}-booking` : safe;
}

type Mode = "booksuite" | "own";

/**
 * Lets the owner choose how customer emails are signed: the BookSuite-branded
 * sender (default) or their own business name with replies in their inbox.
 * The verified sending address itself never changes — that is what keeps
 * customer mail out of spam folders.
 */
const EmailSenderCard = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("booksuite");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [savedLocal, setSavedLocal] = useState("");
  const [localPart, setLocalPart] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sampling, setSampling] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("business_settings")
      .select("business_name, business_email, email_from_mode, email_from_local")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const name = data?.business_name || "";
        setBusinessName(name);
        setBusinessEmail(data?.business_email || "");
        setMode(data?.email_from_mode === "own" ? "own" : "booksuite");
        setSavedLocal(data?.email_from_local || "");
        setLocalPart(data?.email_from_local || slugToLocalPart(name));
        setReady(true);
      });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setAccountEmail(session?.user?.email || "");
    });
    return () => {
      active = false;
    };
  }, [userId, savedLocal]);

  const derivedLocal = slugToLocalPart(businessName);
  const effectiveLocal = isValidLocalPart(localPart) ? localPart : derivedLocal;
  const previewFrom =
    mode === "own" ? businessName || "Your business" : `${businessName || "Your business"} via BookSuite`;
  const previewAddress = mode === "own" ? `${effectiveLocal}@${FROM_DOMAIN}` : `noreply@${FROM_DOMAIN}`;
  const previewReply = mode === "own" ? businessEmail || SUPPORT_EMAIL : SUPPORT_EMAIL;
  const canGoOwn = !!businessEmail;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("business_settings")
      .update({
        email_from_mode: mode,
        email_from_local: mode === "own" ? effectiveLocal : null,
      })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    setSavedLocal(mode === "own" ? effectiveLocal : "");
    toast({
      title: "Sender updated",
      description: "New customer emails will use it straight away.",
    });
  };

  const sendSample = async () => {
    if (!accountEmail) {
      toast({ title: "No account email", description: "Sign in again and try once more.", variant: "destructive" });
      return;
    }
    setSampling(true);
    await sendEmail(
      "booking-reminder-client",
      accountEmail,
      `sender-sample-${Date.now()}`,
      {
        businessName: businessName || "Your business",
        clientName: "You",
        service: "Sample of how your emails look",
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        time: "14:30",
        manageUrl: `${publicBookingUrl()}`,
      },
      userId
    );
    setSampling(false);
    toast({
      title: "Sample sent",
      description: `Check ${accountEmail} — including the Junk folder, if it's a new address.`,
    });
  };

  return (
    <SectionCard>
      <AccordionItem value="email-sender" className="border-0">
        <AccordionTrigger className="hover:no-underline py-2">
          <span className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <Mail size={20} />
            </span>
            <span className="text-base font-semibold text-foreground leading-tight">Emails to your customers</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-5 pb-5">
          <div className="rounded-lg border border-border bg-secondary/60 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">What your customer sees</p>
            <p className="text-sm text-foreground">
              From: <span className="font-semibold">{previewFrom}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">&lt;{previewAddress}&gt;</span>
            </p>
            <p className="text-sm text-foreground">
              Replies go to: <span className="font-mono text-xs">{previewReply}</span>
            </p>
          </div>

          <RadioGroup
            value={mode}
            onValueChange={(v) => {
              if (v === "own" && !canGoOwn) {
                toast({
                  title: "Add your business email first",
                  description: "Save a business email in Company Info so replies have somewhere to land.",
                });
                return;
              }
              setMode(v as Mode);
            }}
            className="space-y-3"
          >
            <label
              htmlFor="sender-booksuite"
              className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3 cursor-pointer"
            >
              <RadioGroupItem value="booksuite" id="sender-booksuite" className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">BookSuite sender</span>
                <span className="block text-xs text-muted-foreground">
                  Your business name plus BookSuite. Replies reach our team. This is the default.
                </span>
              </span>
            </label>
            <label
              htmlFor="sender-own"
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                canGoOwn
                  ? "border-border bg-secondary/40 cursor-pointer"
                  : "border-border/50 bg-secondary/20 opacity-60"
              }`}
            >
              <RadioGroupItem value="own" id="sender-own" className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">Your own business name</span>
                <span className="block text-xs text-muted-foreground">
                  Emails show just your business name and replies land in your own inbox.
                </span>
              </span>
            </label>
          </RadioGroup>

          {!canGoOwn && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                Add your business email under Company Info to switch to your own sender name — customer
                replies need somewhere to arrive.
              </p>
            </div>
          )}

          {mode === "own" && canGoOwn && (
            <div className="space-y-2">
              <Label className="text-foreground">Your email address for customers</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={localPart}
                  onChange={(e) => setLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "-"))}
                  className="bg-secondary border-border font-mono max-w-[240px]"
                  placeholder={derivedLocal}
                />
                <span className="font-mono text-sm text-muted-foreground">@{FROM_DOMAIN}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Letters, numbers, dots and dashes. If you leave it blank we use your business name.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            The sending address always sits on a domain BookSuite has verified — that is what keeps your
            customers' emails out of spam folders. BookSuite stays credited inside every email whatever
            you choose here.
          </p>

          {ready && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving} size="sm">
                {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Save
              </Button>
              <Button onClick={sendSample} disabled={sampling} size="sm" variant="outline">
                {sampling ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
                Send myself a sample
              </Button>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </SectionCard>
  );
};

function publicBookingUrl(): string {
  return "https://booksuite.online/my-bookings";
}

export default EmailSenderCard;
