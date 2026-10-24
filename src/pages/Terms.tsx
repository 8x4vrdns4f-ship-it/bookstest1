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
      <p className="text-muted-foreground mb-8">Last updated: 24 October 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-4">
          <p className="font-medium text-foreground mb-1">Company details — to be completed before launch</p>
          <ul className="space-y-0.5">
            <li>Registered company name: [TO BE ADDED]</li>
            <li>Company registration number: [TO BE ADDED]</li>
            <li>Registered address: [TO BE ADDED]</li>
            <li>Governing law / jurisdiction: [TO BE ADDED]</li>
            <li>Refund policy: [TO BE ADDED]</li>
          </ul>
        </div>

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
          <h2 className="text-xl font-semibold mb-2 text-foreground">Payments, refunds and chargebacks (for businesses)</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You set your own cancellation policy (cancellation window and deposit) using BookSuite's tools, and it is shown to your clients before they pay.</li>
            <li>Stripe's card processing fees are passed through to you and deducted from each booking payment.</li>
            <li>When a booking payment is refunded, the refunded amount is recovered from you. BookSuite's platform fee is not refunded.</li>
            <li>Chargebacks, Stripe's dispute fees and any shortfall from refunds are owed by you. BookSuite may recover them from your future booking payouts or add them to your subscription invoice.</li>
            <li>Refunds of your BookSuite subscription are handled separately, at BookSuite's discretion.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Booking cancellations and refunds (for clients)</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Each business sets its own cancellation policy, and it is shown to you before you pay.</li>
            <li>If you cancel later than the business's cancellation window, or don't turn up, your deposit is forfeited.</li>
            <li>For any refund question, contact the business you booked with first.</li>
          </ul>
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
