import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, ListChecks, Share2 } from "lucide-react";

const STEPS = [
  { icon: Upload, title: "Import your clients", text: "Export your client list from Fresha, Treatwell, Booksy or a spreadsheet, and drop the file in. Everyone lands in BookSuite in seconds." },
  { icon: ListChecks, title: "Add your services", text: "Prices, lengths and who does what. Most shops are done in under 10 minutes." },
  { icon: Share2, title: "Share your new link", text: "Swap the link in your Instagram or TikTok bio, print the QR code for your counter, and you're live." },
];

export default function SwitchingSection() {
  return (
    <section className="px-6 md:px-16 py-16 md:py-20 border-t border-border bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-10">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">Switching is easy</span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">Coming from Fresha, Treatwell or pen &amp; paper?</h2>
          <p className="text-muted-foreground">Keep your clients, drop the commission. Moving over takes three steps.</p>
        </div>
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center"><s.icon className="h-5 w-5" /></span>
                <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8"><Button asChild size="lg"><Link to="/auth?mode=signup">Make the switch</Link></Button></div>
      </div>
    </section>
  );
}
