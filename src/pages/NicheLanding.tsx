import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { NICHES, getNiche } from "@/lib/niches";

const SITE = "https://booksuite.online";

const NicheLanding = () => {
  const { slug } = useParams();
  const niche = getNiche(slug);
  if (!niche) return <Navigate to="/" replace />;

  const url = `${SITE}/for/${niche.slug}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `BookSuite for ${niche.name}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url,
      description: niche.seoDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: niche.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: niche.name, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={niche.seoTitle} description={niche.seoDescription} path={`/for/${niche.slug}`} />
      <JsonLd data={ld} />
      <Navbar />
      <main className="flex-1 px-6 md:px-16 py-12 max-w-5xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <section className="text-center mb-16">
          <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">BookSuite for {niche.name}</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">{niche.headline}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{niche.subheadline}</p>
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/auth?mode=signup">Start your 30-day free trial</Link>
          </Button>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Sound familiar?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {niche.pains.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">How BookSuite helps {niche.name.toLowerCase()}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {niche.features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <Check className="text-primary mb-3" size={20} />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-2">What your booking page could look like</h2>
          <p className="text-sm text-muted-foreground mb-6">Example services — you set your own names, times and prices.</p>
          <ul className="divide-y divide-border">
            {niche.exampleServices.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-3">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1"><Clock size={14} /> {s.duration}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Questions</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {niche.faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-border bg-card p-5 group">
                <summary className="font-semibold cursor-pointer list-none">{f.q}</summary>
                <p className="text-sm text-muted-foreground mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="p-8 rounded-2xl border border-primary/30 bg-primary/5 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Ready to fill your diary?</h2>
          <p className="text-muted-foreground mb-6">Set up in minutes. 30 days free.</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/auth?mode=signup">Start free trial</Link>
          </Button>
        </section>

        <nav aria-label="Other industries" className="text-center text-sm text-muted-foreground">
          <span className="mr-2">BookSuite also works for:</span>
          {NICHES.filter((n) => n.slug !== niche.slug).map((n) => (
            <Link key={n.slug} to={`/for/${n.slug}`} className="mx-2 hover:text-primary underline-offset-4 hover:underline">
              {n.name}
            </Link>
          ))}
        </nav>
      </main>
      <Footer />
    </div>
  );
};

export default NicheLanding;
