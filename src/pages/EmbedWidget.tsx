import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { buildWidgetHtml } from "@/lib/widgetTemplate";
import { getStripeEnvironment } from "@/lib/connectPayments";

// Renders the booking widget standalone for use in an iframe.
// Uses srcDoc to keep styles fully isolated from the host page / app.
const EmbedWidget = () => {
  const { userId } = useParams<{ userId: string }>();
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
  }, []);

  if (!userId) return null;

  const html = buildWidgetHtml({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    userId,
    paymentEnvironment: getStripeEnvironment(),
    stripePublishableKey: String(import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN || ""),
  });

  return (
    <iframe
      ref={ref}
      title="Booking widget"
      srcDoc={html}
      style={{ border: "none", width: "100%", height: "100vh", background: "transparent" }}
    />
  );
};

export default EmbedWidget;
