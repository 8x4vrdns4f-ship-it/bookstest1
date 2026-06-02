import { useParams } from "react-router-dom";
import { buildWidgetHtml } from "@/lib/widgetTemplate";
import SEO from "@/components/SEO";

// Full-page branded booking link, ideal for "Book Now" buttons or social bios.
const PublicBooking = () => {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return null;

  const html = buildWidgetHtml({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    userId,
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Book an Appointment" description="Book your next appointment online." path={`/book/${userId}`} />
      <iframe
        title="Booking widget"
        srcDoc={html}
        style={{ border: "none", width: "100%", maxWidth: 500, height: 760, background: "transparent" }}
      />
    </div>
  );
};

export default PublicBooking;
