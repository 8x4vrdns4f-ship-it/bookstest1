import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { noShowLoss, DEPOSIT_RECOVERY } from "@/lib/noShowCalc";

const gbp = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

const ld = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "No-Show Cost Calculator",
  url: "https://booksuite.online/tools/no-show-calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  description: "Work out how much money missed appointments cost your salon, barbershop or studio each year.",
};

export default function NoShowCalculator() {
  const [price, setPrice] = useState(30);
  const [perWeek, setPerWeek] = useState(3);
  const r = noShowLoss(price, perWeek);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="No-Show Cost Calculator for Salons & Barbers — BookSuite"
        description="Free calculator: see how much missed appointments cost your business each year, and how much taking deposits could win back."
        path="/tools/no-show-calculator"
      />
      <JsonLd data={ld} />
      <Navbar />
      <main className="px-6 md:px-16 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">Free tool</span>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">How much are no-shows costing you?</h1>
          <p className="text-muted-foreground max-w-2xl mb-10">
            Every empty chair is money you can't get back. Enter two numbers and see what missed appointments cost your business over a year.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-8">
              <div className="space-y-3">
                <Label htmlFor="price">Average appointment price (£)</Label>
                <Input id="price" type="number" min={0} inputMode="decimal" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><Label>No-shows per week</Label><span className="font-semibold text-foreground">{perWeek}</span></div>
                <Slider min={0} max={20} step={1} value={[perWeek]} onValueChange={(v) => setPerWeek(v[0])} />
              </div>
              <p className="text-xs text-muted-foreground">Based on 50 working weeks a year.</p>
            </div>

            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-6 flex flex-col">
              <div className="text-sm text-muted-foreground">You lose about</div>
              <div className="text-4xl md:text-5xl font-bold text-foreground my-1">{gbp(r.yearly)}</div>
              <div className="text-sm text-muted-foreground mb-6">a year ({gbp(r.monthly)} a month)</div>
              <div className="rounded-xl bg-card border border-border p-4 mb-6">
                <div className="text-sm text-muted-foreground">Taking deposits could win back around</div>
                <div className="text-2xl font-bold text-primary">{gbp(r.recovered)} / year</div>
                <div className="text-[11px] text-muted-foreground mt-1">Assumes deposits stop about {Math.round(DEPOSIT_RECOVERY * 100)}% of no-shows.</div>
              </div>
              <Button asChild size="lg" className="mt-auto"><Link to="/auth?mode=signup">Start taking deposits</Link></Button>
            </div>
          </div>

          <section className="mt-16 max-w-2xl space-y-4 text-muted-foreground">
            <h2 className="text-2xl font-bold text-foreground">How to cut no-shows</h2>
            <p><strong className="text-foreground">Take a deposit when they book.</strong> Customers who've paid something turn up. BookSuite lets you take a deposit or full payment online.</p>
            <p><strong className="text-foreground">Send reminders.</strong> An automatic email reminder before the appointment jogs memories and lets people reschedule instead of ghosting.</p>
            <p><strong className="text-foreground">Make rescheduling easy.</strong> If customers can move their own booking in two taps, they're far less likely to just not show.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
