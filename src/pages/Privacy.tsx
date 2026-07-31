import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Privacy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Privacy Policy — BookSuite"
      description="How BookSuite collects, uses, and protects your data."
      path="/privacy"
    />
    <Navbar />
    <main className="flex-1 px-6 md:px-16 py-12 max-w-3xl mx-auto text-foreground">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Company details — to be completed before launch</p>
          <ul className="space-y-0.5">
            <li>Registered company name: [TO BE ADDED]</li>
            <li>Company registration number: [TO BE ADDED]</li>
            <li>Registered address: [TO BE ADDED]</li>
            <li>ICO registration number: [TO BE ADDED]</li>
            <li>Data protection contact: help@booksuite.online</li>
          </ul>
        </div>

        <p>
          This page is maintained by BookSuite to explain how we handle information
          when you use booksuite.online (the "Service"). It is not a legal
          certification — reach out at{" "}
          <a href="mailto:help@booksuite.online" className="text-primary underline">
            help@booksuite.online
          </a>{" "}
          with any questions.
        </p>


        <div>
          <h2 className="text-xl font-semibold mb-2">Information we collect</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Account details you provide (name, email, business name).</li>
            <li>Booking, client, and staff data you or your team enter.</li>
            <li>Payment metadata processed by Stripe (we never store card numbers).</li>
            <li>Basic usage analytics to keep the product reliable.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">How we use it</h2>
          <p className="text-muted-foreground">
            To operate the Service, send transactional emails (booking confirmations,
            receipts, account notifications), prevent abuse, and improve features.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Subprocessors</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Supabase — database, auth, and edge functions.</li>
            <li>Stripe — payment processing.</li>
            <li>Resend — transactional email delivery.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Your rights</h2>
          <p className="text-muted-foreground">
            You can request access to, correction of, or deletion of your data by
            emailing help@booksuite.online. Account owners can delete their
            workspace from Settings at any time.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Cookies</h2>
          <p className="text-muted-foreground">
            We use essential cookies to keep you signed in. We do not sell your data.
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Privacy;
