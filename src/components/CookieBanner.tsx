import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const KEY = "booksuite:cookie-consent";

/** Marketing/legal pages only — never over the signed-in app or a customer's booking flow. */
const HIDDEN_PREFIXES = [
  "/dashboard", "/settings", "/payments", "/employee-dashboard",
  "/onboarding", "/kiosk", "/embed", "/book", "/booking", "/review",
];

const CookieBanner = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const choose = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
  };

  if (!visible) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 md:inset-x-auto md:right-5 md:bottom-5 md:max-w-md"
    >
      <div className="rounded-[16px] border border-border bg-card/95 backdrop-blur p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
            <Cookie size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground mb-1">We use cookies</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Essential cookies keep you signed in and payments secure. Optional analytics
              cookies help us improve BookSuite — your choice.{" "}
              <Link to="/cookies" className="text-primary underline">Read more</Link>.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" onClick={() => choose("accepted")}>Accept all</Button>
              <Button size="sm" variant="outline" onClick={() => choose("rejected")}>
                Essential only
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
