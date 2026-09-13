import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Page Not Found — BookSuite"
        description="The page you're looking for doesn't exist. Head back to BookSuite to manage your bookings, clients, and staff."
        path={location.pathname}
        noIndex
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold tracking-widest text-primary mb-3">404</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            We couldn't find that page
          </h1>
          <p className="text-muted-foreground mb-8">
            The link may be out of date or mistyped. Here are a few places to try instead.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="shadow-[var(--shadow-glow)]">
              <Link to="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pricing">See pricing</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/contact">Contact support</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
