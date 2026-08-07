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
      className="fixed inset-x-2 bottom-2 z-50 md:inset-x-auto md:right-4 md:bottom-4 md:max-w-[340px]"
    >
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2.5 shadow-md">
        <div className="flex items-center gap-2.5">
          <Cookie size={15} className="shrink-0 text-primary" />
          <p className="min-w-0 flex-1 text-[12px] leading-snug text-muted-foreground">
            We use cookies to keep BookSuite working and improve it.{" "}
            <Link to="/cookies" className="text-primary underline">Details</Link>
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button size="sm" className="h-7 px-2.5 text-[12px]" onClick={() => choose("accepted")}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[12px]"
              onClick={() => choose("rejected")}
            >
              Essential
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
