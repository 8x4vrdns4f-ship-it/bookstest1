import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Security = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Security — BookSuite"
      description="How BookSuite keeps your booking and client data safe."
      path="/security"
    />
    <Navbar />
    <main className="flex-1 px-6 md:px-16 py-12 max-w-3xl mx-auto text-foreground">
      <h1 className="text-4xl font-bold mb-2">Security</h1>
      <p className="text-muted-foreground mb-8">
        This page is maintained by BookSuite to answer common security questions.
        It is not an independent certification.
      </p>

      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Authentication</h2>
          <p>
            Email + password with mandatory email verification before dashboard access.
            Passwords are hashed by our auth provider — we never see them in plaintext.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Data isolation</h2>
          <p>
            All customer data lives behind Row-Level Security policies scoped to your
            account. Employees only see the data their role is granted access to.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Payments</h2>
          <p>
            Card details never touch our servers — they go directly to Stripe. We hold
            only the Stripe reference IDs needed to reconcile bookings and refunds.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">In transit and at rest</h2>
          <p>
            All traffic is served over HTTPS. Database and file storage are encrypted at
            rest by our hosting provider.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Reporting a vulnerability</h2>
          <p>
            Please email{" "}
            <a href="mailto:security@booksuite.online" className="text-primary underline">
              security@booksuite.online
            </a>{" "}
            with details. We aim to acknowledge reports within 72 hours.
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Security;
