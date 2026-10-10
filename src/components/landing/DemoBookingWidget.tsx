import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronLeft, Scissors, User, CalendarDays, Clock, Sparkles } from "lucide-react";

/** Fully local demo of the customer booking flow — nothing is saved or sent. */
const SERVICES = [
  { id: "fade", name: "Skin fade", mins: 30, price: 22 },
  { id: "cut", name: "Classic haircut", mins: 30, price: 18 },
  { id: "beard", name: "Haircut & beard trim", mins: 45, price: 30 },
  { id: "kids", name: "Kids cut (under 12)", mins: 20, price: 14 },
];
const BARBERS = [
  { id: "any", name: "Any barber", note: "Earliest available" },
  { id: "jordan", name: "Jordan", note: "Fades & designs" },
  { id: "marcus", name: "Marcus", note: "Beards & classic cuts" },
  { id: "liam", name: "Liam", note: "Kids & scissor work" },
];
const TIMES = ["09:30", "10:15", "11:00", "12:30", "14:00", "15:15", "16:30", "17:45"];
const STEPS = ["Service", "Barber", "Time", "Details"] as const;

export default function DemoBookingWidget() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<string | null>(null);
  const [barber, setBarber] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; }),
    [],
  );
  // Hide a few slots per day/barber so it feels real.
  const taken = (t: string, i: number) => (i + day + (barber?.length ?? 0)) % 3 === 0;
  const svc = SERVICES.find((s) => s.id === service);
  const brb = BARBERS.find((b) => b.id === barber);

  const reset = () => { setStep(0); setService(null); setBarber(null); setTime(null); setName(""); setDone(false); };

  return (
    <section id="try-demo" className="px-6 md:px-16 py-16 md:py-24 border-t border-border">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">Try it yourself</span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">Book a pretend haircut — see what your customers see</h2>
          <p className="text-muted-foreground mb-6">
            This is a sample barber shop. Pick a service, choose your barber, grab a time and confirm. It takes about 20 seconds — and nothing is saved.
          </p>
          <ul className="space-y-2 text-sm text-foreground/90 mb-8">
            {["Customers choose the service and the person they want", "Only real free slots are shown — no double-bookings", "Works on any phone, no app or account needed"].map((p) => (
              <li key={p} className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{p}</li>
            ))}
          </ul>
          <Button asChild size="lg"><Link to="/auth?mode=signup">Get this for your business</Link></Button>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-w-md w-full mx-auto">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center"><Scissors className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold text-foreground">The Sample Barbers</div>
              <div className="text-xs text-muted-foreground">Demo booking page</div>
            </div>
          </div>

          {done ? (
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-success/15 text-success grid place-items-center"><Check className="h-7 w-7" /></div>
              <div className="text-lg font-semibold text-foreground">You're booked{name ? `, ${name.split(" ")[0]}` : ""}!</div>
              <div className="rounded-xl bg-secondary/50 p-4 text-sm text-left space-y-1.5">
                <div><span className="text-muted-foreground">Service:</span> {svc?.name} · £{svc?.price}</div>
                <div><span className="text-muted-foreground">Barber:</span> {brb?.name}</div>
                <div><span className="text-muted-foreground">When:</span> {days[day].toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })} at {time}</div>
              </div>
              <p className="text-xs text-muted-foreground">In the real thing, the customer gets a confirmation email and you get notified instantly.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
                <Button asChild size="sm"><Link to="/auth?mode=signup">Start free</Link></Button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                {step > 0 && (
                  <button onClick={() => setStep(step - 1)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary" aria-label="Back">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {STEPS.map((s, i) => <div key={s} className={`h-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />)}
                </div>
                <span className="text-xs text-muted-foreground">{STEPS[step]}</span>
              </div>

              {step === 0 && (
                <div className="space-y-2">
                  {SERVICES.map((s) => (
                    <button key={s.id} onClick={() => { setService(s.id); setStep(1); }}
                      className={`w-full text-left rounded-xl border p-3 flex justify-between items-center min-h-11 transition-colors ${service === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      <div><div className="font-medium text-sm text-foreground">{s.name}</div><div className="text-xs text-muted-foreground">{s.mins} min</div></div>
                      <div className="font-semibold text-sm text-foreground">£{s.price}</div>
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-2 gap-2">
                  {BARBERS.map((b) => (
                    <button key={b.id} onClick={() => { setBarber(b.id); setTime(null); setStep(2); }}
                      className={`rounded-xl border p-3 text-left transition-colors ${barber === b.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center mb-2">
                        {b.id === "any" ? <Sparkles className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="font-medium text-sm text-foreground">{b.name}</div>
                      <div className="text-[11px] text-muted-foreground">{b.note}</div>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {days.map((d, i) => (
                      <button key={i} onClick={() => { setDay(i); setTime(null); }}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-center min-w-14 ${day === i ? "border-primary bg-primary/10" : "border-border"}`}>
                        <div className="text-[11px] text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                        <div className="font-semibold text-foreground">{d.getDate()}</div>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMES.map((t, i) => {
                      const off = taken(t, i);
                      return (
                        <button key={t} disabled={off} onClick={() => { setTime(t); setStep(3); }}
                          className={`rounded-lg border py-2 text-sm min-h-11 ${off ? "border-border text-muted-foreground/40 line-through cursor-not-allowed" : time === t ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground hover:border-primary/40"}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
                  <div className="rounded-xl bg-secondary/50 p-3 text-sm space-y-1">
                    <div className="flex items-center gap-2"><Scissors className="h-3.5 w-3.5 text-primary" />{svc?.name} · £{svc?.price}</div>
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" />{brb?.name}</div>
                    <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-primary" />{days[day].toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}<Clock className="h-3.5 w-3.5 text-primary ml-2" />{time}</div>
                  </div>
                  <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
                  <Input placeholder="Email (demo — not used)" type="email" disabled />
                  <Button type="submit" className="w-full">Confirm booking</Button>
                  <p className="text-[11px] text-center text-muted-foreground">Demo only — nothing is saved or sent.</p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
