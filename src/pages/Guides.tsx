import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import { GUIDES } from "@/components/landing/GuidesSection";

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://booksuite.online/" },
    { "@type": "ListItem", position: 2, name: "Guides", item: "https://booksuite.online/guides" },
  ],
};

const Guides = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Guides for booking-based businesses — BookSuite"
        description="Short, practical guides on taking deposits, cutting no-shows and choosing booking software for your service business."
        path="/guides"
      />
      <JsonLd data={breadcrumbLd} />
      <Navbar />
      <main className="flex-1 px-6 md:px-16 py-12 max-w-3xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Guides for growing a booking-based business</h1>
        <p className="text-muted-foreground max-w-2xl mb-10">
          Short, practical guides on running a service business — from taking deposits to
          cutting no-shows to embedding a booking widget on your own site.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              to={`/guides/${g.slug}`}
              className="group block rounded-xl border border-border bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all p-6"
            >
              <p className="text-xs text-muted-foreground mb-3">{g.readTime}</p>
              <h2 className="text-lg font-semibold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                {g.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{g.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                Read guide <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 text-sm">
          <Link to="/pricing" className="text-primary underline">See pricing</Link>
          <Link to="/for/barbers" className="text-primary underline">See BookSuite for barbers</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Guides;
