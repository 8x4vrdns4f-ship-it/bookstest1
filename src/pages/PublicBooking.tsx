import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { buildWidgetHtml } from "@/lib/widgetTemplate";
import { getStripeEnvironment } from "@/lib/connectPayments";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import PublicBookingHeader from "@/components/booking/PublicBookingHeader";
import PublicBookingTrustStrip from "@/components/booking/PublicBookingTrustStrip";
import PoweredByBookSuite from "@/components/booking/PoweredByBookSuite";
import WaitlistDialog from "@/components/booking/WaitlistDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { cancelPolicyText } from "@/lib/cancelPolicy";


interface PublicInfo {
  business_name: string | null;
  business_category: string | null;
  business_address: string | null;
  business_phone: string | null;
  accent_color: string | null;
  welcome_message: string | null;
  cancellation_hours: number | null;
  average_rating: number | null;
  review_count: number | null;
}


const PublicBooking = () => {
  const { userId } = useParams<{ userId: string }>();
  const [info, setInfo] = useState<PublicInfo | null>(null);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [showBranding, setShowBranding] = useState(true);
  const [policy, setPolicy] = useState<{ deposit: number; currency: string; hours: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetHeight, setWidgetHeight] = useState(760);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; height?: number } | null;
      if (!data || data.type !== "booksuite:height") return;
      const h = Number(data.height);
      if (h > 100 && h < 5000) setWidgetHeight(Math.ceil(h));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const [{ data: pub }, { data: ws }] = await Promise.all([
        supabase.rpc("get_public_business_info", { _user_id: userId }),
        supabase.rpc("get_widget_settings", { p_user_id: userId }),
      ]);
      if (!active) return;
      setInfo((pub as PublicInfo[] | null)?.[0] ?? null);
      setWaitlistEnabled(!!(ws as any[] | null)?.[0]?.waitlist_enabled);
      const w = (ws as any[] | null)?.[0];
      setShowBranding(w?.show_branding !== false);
      if (w) setPolicy({ deposit: Number(w.deposit_amount || 0), currency: w.currency || "GBP", hours: w.cancellation_hours ?? null });
      setLoading(false);
    })();
    return () => { active = false; };
  }, [userId]);


  if (!userId) return null;

  const html = buildWidgetHtml({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    userId,
    paymentEnvironment: getStripeEnvironment(),
    stripePublishableKey: String(import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN || ""),
  });

  const businessName = info?.business_name || "Book an appointment";
  const seoTitle = info?.business_name
    ? `Book with ${info.business_name} — BookSuite`
    : "Book an appointment — BookSuite";
  const seoDescription =
    info?.welcome_message?.slice(0, 155) ||
    (info?.business_name
      ? `Book your next appointment with ${info.business_name} online in seconds.`
      : "Book your next appointment online.");

  const jsonLd = info?.business_name && (info.business_address || info.business_phone)
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: info.business_name,
        ...(info.business_category && { description: info.business_category }),
        ...(info.business_address && { address: info.business_address }),
        ...(info.business_phone && { telephone: info.business_phone }),
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={seoTitle} description={seoDescription} path={`/book/${userId}`} noIndex />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/\//g, "\\u002f"),
          }}
        />
      )}

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-14 space-y-8">
        {loading ? (
          <div className="space-y-3 text-center">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        ) : (
          <PublicBookingHeader
            businessName={businessName}
            category={info?.business_category}
            address={info?.business_address}
            phone={info?.business_phone}
            accentColor={info?.accent_color}
            averageRating={info?.average_rating ? Number(info.average_rating) : null}
            reviewCount={info?.review_count ?? null}
          />
        )}

        {info?.welcome_message && !loading && (
          <p className="max-w-xl mx-auto text-center text-muted-foreground text-sm md:text-base">
            {info.welcome_message}
          </p>
        )}

        <div className="mx-auto w-full max-w-[520px] rounded-2xl border border-border/60 bg-card/60 shadow-2xl shadow-black/30 p-2 md:p-3">
          <iframe
            title="Booking widget"
            srcDoc={html}
            style={{ border: "none", width: "100%", height: widgetHeight, background: "transparent", borderRadius: 12, transition: "height .2s ease" }}
          />
        </div>

        {waitlistEnabled && !loading && (
          <div className="flex justify-center">
            <WaitlistDialog userId={userId} businessName={businessName} />
          </div>
        )}

        <PublicBookingTrustStrip cancellationHours={info?.cancellation_hours} />

        {policy && (
          <div className="flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="inline-flex items-center min-h-10 px-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Cancellation policy
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancellation policy</DialogTitle>
                  <DialogDescription className="space-y-2 pt-2 text-left">
                    <span className="block">{cancelPolicyText({ hours: policy.hours ?? info?.cancellation_hours, deposit: policy.deposit, currency: policy.currency })}</span>
                    {policy.deposit > 0 && (
                      <span className="block">{cancelPolicyText({ hours: policy.hours ?? info?.cancellation_hours, deposit: policy.deposit, currency: policy.currency, paidInFull: true }).replace(/^Free cancellation[^.]*\. Cancel later than that and /, "If you paid in full and cancel late, ")}</span>
                    )}
                    <span className="block">Refunds go back to your original payment method and take 5–10 working days to show. For anything else, contact {businessName === "Book an appointment" ? "the business" : businessName} directly.</span>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        )}


        {showBranding && <PoweredByBookSuite className="pt-2" source="booking-page" />}
      </div>
    </div>
  );
};

export default PublicBooking;
