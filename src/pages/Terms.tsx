import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Terms = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Terms of Service — BookSuite"
      description="The terms that govern your use of BookSuite."
      path="/terms"
    />
    <Navbar />
    <main className="flex-1 px-6 md:px-16 py-12 max-w-3xl mx-auto text-foreground">
      <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          By creating a BookSuite account you agree to these terms. If you do not agree,
          do not use the Service.
        </p>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Your account</h2>
          <p>
            You are responsible for keeping your login credentials secure and for all
            activity that happens under your account. Do not share credentials with
            other people; invite them as employees instead.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Acceptable use</h2>
          <p>
            No spam, abuse, illegal content, or attempts to interfere with the Service.
            We may suspend accounts that violate these rules.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Payments</h2>
          <p>
            Subscription fees are billed in advance and non-refundable except where
            required by law. Transaction fees on bookings are collected via Stripe
            Connect at the rate shown on the Pricing page for your plan.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Cancellation</h2>
          <p>
            You may cancel your subscription any time from Settings. Access continues
            until the end of the paid period.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Warranty and liability</h2>
          <p>
            The Service is provided "as is". To the extent permitted by law, BookSuite
            is not liable for indirect or consequential damages arising from use of the
            Service.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Contact</h2>
          <p>
            Questions? Email{" "}
            <a href="mailto:help@booksuite.online" className="text-primary underline">
              help@booksuite.online
            </a>
            .
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Terms;
