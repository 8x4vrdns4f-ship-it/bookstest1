import { ArrowRight, CalendarCheck } from "lucide-react";

interface Props {
  /** Where the visitor came from, used for attribution on the sign-up link. */
  source?: string;
  className?: string;
}

/**
 * Viral growth badge shown on public booking pages.
 * Every customer who books somewhere sees a low-key invitation to get their own
 * booking page — turning each hosted business into a billboard for BookSuite.
 */
const PoweredByBookSuite = ({ source = "booking-page", className = "" }: Props) => {
  const href = `https://booksuite.online/auth?mode=signup&ref=${encodeURIComponent(source)}`;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-card/80"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarCheck className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-foreground">
            Run a business? Take bookings &amp; card payments like this.
          </span>
          <span className="block text-xs text-muted-foreground">
            Powered by BookSuite — set up your own booking page free in 2 minutes.
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary whitespace-nowrap">
          Get started
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </a>
    </div>
  );
};

export default PoweredByBookSuite;
