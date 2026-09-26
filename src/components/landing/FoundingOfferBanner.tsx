import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Founding-member offer. Shows only while fewer than 100 businesses have
 * signed up — the count comes from the server, so it disappears on its own.
 */
const FoundingOfferBanner = () => {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    supabase.rpc("get_founding_spots_remaining").then(({ data, error }) => {
      if (!error && typeof data === "number") setRemaining(data);
    });
  }, []);

  if (remaining === null || remaining <= 0) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4 py-2.5 text-center text-sm sm:flex-row sm:gap-3">
        <span className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <span>
            <strong>Founding member offer:</strong> half-price booking fees for your first 30 days.{" "}
            <span className="font-semibold text-primary">Only {remaining} of 100 spots left.</span>
          </span>
        </span>
        <Link
          to="/auth?mode=signup&ref=founding-banner"
          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Claim your spot →
        </Link>
      </div>
    </div>
  );
};

export default FoundingOfferBanner;
