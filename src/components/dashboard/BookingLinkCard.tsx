import { publicOrigin } from "@/lib/publicUrl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, ExternalLink, Code2, Share2, AlertTriangle } from "lucide-react";
import SectionCard from "@/components/app/SectionCard";
import EmbedWidgetDialog from "@/components/dashboard/EmbedWidgetDialog";
import { usePaymentsReady } from "@/hooks/usePaymentsReady";

type Props = {
  userId: string;
  title?: string;
  description?: string;
  className?: string;
};

/** Shows the owner's public booking link with copy / preview / embed actions. */
export default function BookingLinkCard({
  userId,
  title = "Let's get your first booking",
  description = "Share your booking link and customers can book you in seconds — no app, no account needed.",
  className,
}: Props) {
  const [copied, setCopied] = useState(false);
  const paymentsReady = usePaymentsReady(userId);
  const bookingUrl = `${publicOrigin()}/book/${userId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <SectionCard
      className={className}
      icon={<Share2 size={18} />}
      title={title}
      description={description}
    >
      <div className="space-y-3">
        {paymentsReady === false && (
          <div className="flex gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
            <p>
              Your link won't take bookings until you finish payment setup. Connect payments in the Payments
              card above, then share it.
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input readOnly value={bookingUrl} className="font-mono text-xs" aria-label="Your booking link" />
          <Button type="button" variant="secondary" onClick={copy} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1.5">{copied ? "Copied" : "Copy link"}</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Preview as a customer
            </a>
          </Button>
          <EmbedWidgetDialog
            userId={userId}
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5">
                <Code2 className="h-3.5 w-3.5" /> Add to your website
              </Button>
            }
          />
        </div>
      </div>
    </SectionCard>
  );
}
