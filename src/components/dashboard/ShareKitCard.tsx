import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { publicOrigin } from "@/lib/publicUrl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Printer, Share2, Copy, Check, Instagram } from "lucide-react";
import SectionCard from "@/components/app/SectionCard";
import SocialLaunchKit from "./SocialLaunchKit";

type Props = { userId: string; businessName?: string | null; className?: string };

/**
 * Owner share kit: printable QR code for the counter plus one-tap sharing
 * so owners can put their booking link in Instagram/TikTok bios, WhatsApp, etc.
 */
export default function ShareKitCard({ userId, businessName, className }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const bookingUrl = `${publicOrigin()}/book/${userId}`;
  const name = businessName || "your business";

  useEffect(() => {
    QRCode.toDataURL(bookingUrl, { width: 640, margin: 2, color: { dark: "#0F172A", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [bookingUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  const share = async () => {
    const text = `Book your appointment with ${name} online:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Book with ${name}`, text, url: bookingUrl });
        return;
      } catch { /* user cancelled */ }
    }
    await copy();
    toast({ title: "Link copied", description: "Paste it into your Instagram or TikTok bio, WhatsApp status, or anywhere your customers are." });
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "booksuite-booking-qr.png";
    a.click();
  };

  const printQr = () => {
    if (!qrDataUrl) return;
    const win = window.open("", "_blank");
    if (!win) {
      toast({ title: "Popup blocked", description: "Allow popups to print your QR poster.", variant: "destructive" });
      return;
    }
    win.document.write(`<!doctype html><html><head><title>Book with ${name}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:48px;color:#0F172A}
      h1{font-size:32px;margin:0 0 8px}p{font-size:18px;color:#475569;margin:0 0 32px}
      img{width:320px;height:320px}small{display:block;margin-top:24px;font-size:14px;color:#64748B}</style></head>
      <body><h1>Book with ${name}</h1><p>Scan to book your appointment online</p>
      <img src="${qrDataUrl}" alt="Booking QR code"/><small>${bookingUrl}</small>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  return (
    <SectionCard
      className={className}
      icon={<Share2 size={18} />}
      title="Share kit — get the word out"
      description="Put your booking link where your customers already are: your Instagram or TikTok bio, WhatsApp status, or a QR code on your counter."
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR code linking to your booking page"
            className="w-32 h-32 rounded-xl border border-border bg-white p-1.5 shrink-0"
          />
        )}
        <div className="space-y-3 flex-1">
          <p className="text-sm text-muted-foreground">
            Customers scan the code or tap your link and book in seconds — no app, no account.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={share}>
              <Instagram className="h-3.5 w-3.5" /> Share to socials
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadQr}>
              <Download className="h-3.5 w-3.5" /> Download QR
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={printQr}>
              <Printer className="h-3.5 w-3.5" /> Print counter poster
            </Button>
          </div>
        </div>
      </div>
      <SocialLaunchKit bookingUrl={bookingUrl} name={businessName || "us"} />
    </SectionCard>
  );
}
