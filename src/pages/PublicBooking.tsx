import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { buildWidgetHtml } from "@/lib/widgetTemplate";
import { getStripeEnvironment } from "@/lib/connectPayments";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import PublicBookingHeader from "@/components/booking/PublicBookingHeader";
import PublicBookingTrustStrip from "@/components/booking/PublicBookingTrustStrip";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const { data } = await supabase.rpc("get_public_business_info", { _user_id: userId });
      if (!active) return;
      setInfo((data as PublicInfo[] | null)?.[0] ?? null);
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
            style={{ border: "none", width: "100%", height: 760, background: "transparent", borderRadius: 12 }}
          />
        </div>

        <PublicBookingTrustStrip cancellationHours={info?.cancellation_hours} />

        <footer className="text-center text-xs text-muted-foreground pt-4">
          Powered by{" "}
          <a
            href="https://booksuite.online"
            className="font-medium text-foreground hover:text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            BookSuite
          </a>
        </footer>
      </div>
    </div>
  );
};

export default PublicBooking;
