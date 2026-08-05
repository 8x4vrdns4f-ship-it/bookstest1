import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const rows = [
  {
    name: "Session & authentication",
    type: "Strictly necessary",
    purpose: "Keeps you signed in to your dashboard and protects forms against abuse.",
    duration: "Session to 30 days",
  },
  {
    name: "Preferences",
    type: "Strictly necessary",
    purpose: "Remembers your language, cookie choice and dismissed setup steps.",
    duration: "Up to 12 months",
  },
  {
    name: "Stripe",
    type: "Strictly necessary (payments)",
    purpose: "Fraud prevention and secure card processing when a deposit is taken.",
    duration: "Set by Stripe",
  },
  {
    name: "Analytics",
    type: "Optional",
    purpose: "Aggregated page views so we can see which pages help and which don't.",
    duration: "Up to 12 months",
  },
];

const Cookies = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Cookie Policy — BookSuite"
      description="What cookies BookSuite uses, why we use them, and how to control them in your browser."
      path="/cookies"
    />
    <Navbar />

    <main className="flex-1 px-6 md:px-16 py-14 max-w-3xl mx-auto text-foreground">
      <h1 className="text-4xl font-bold mb-2">Cookie policy</h1>
      <p className="text-muted-foreground mb-10">Last updated: {new Date().getFullYear()}</p>

      <section className="space-y-4 text-sm leading-relaxed text-muted-foreground mb-10">
        <p>
          Cookies are small files stored by your browser. BookSuite uses them to keep you
          signed in, remember your preferences, process payments securely, and — only if
          you agree — understand how the site is used.
        </p>
        <p>
          We do not use advertising cookies and we do not sell any data collected through
          cookies.
        </p>
      </section>

      <h2 className="text-2xl font-semibold mb-4">Cookies we use</h2>
      <div className="overflow-x-auto rounded-[16px] border border-border mb-10">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-foreground">
            <tr>
              <th className="text-left font-semibold p-3">Cookie</th>
              <th className="text-left font-semibold p-3">Type</th>
              <th className="text-left font-semibold p-3">Purpose</th>
              <th className="text-left font-semibold p-3">Duration</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-border align-top">
                <td className="p-3 text-foreground font-medium whitespace-nowrap">{r.name}</td>
                <td className="p-3 whitespace-nowrap">{r.type}</td>
                <td className="p-3">{r.purpose}</td>
                <td className="p-3 whitespace-nowrap">{r.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Managing your choice</h2>
          <p>
            You can accept or reject optional cookies using the banner shown on your first
            visit. To change your mind later, clear this site's data in your browser
            settings and the banner will appear again. Blocking strictly necessary cookies
            will stop sign-in and payments from working.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Related policies</h2>
          <p>
            See our <Link to="/privacy" className="text-primary underline">Privacy policy</Link> for
            how we handle personal data, and{" "}
            <Link to="/terms" className="text-primary underline">Terms</Link> for the rules of using
            BookSuite.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Questions</h2>
          <p>
            Email{" "}
            <a href="mailto:help@booksuite.online" className="text-primary underline">
              help@booksuite.online
            </a>{" "}
            or use our <Link to="/contact" className="text-primary underline">contact form</Link>.
          </p>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default Cookies;
