import { useState } from "react";
import { Scissors, UtensilsCrossed, Wrench, Stethoscope, GraduationCap, Car, Check } from "lucide-react";

type Industry = {
  id: string;
  label: string;
  icon: typeof Scissors;
  pitch: string;
  benefits: string[];
};

const INDUSTRIES: Industry[] = [
  {
    id: "salons",
    label: "Salons & Beauty",
    icon: Scissors,
    pitch: "Cut no-shows, fill last-minute slots, and keep every stylist's day booked.",
    benefits: [
      "Take deposits automatically — no more empty chairs",
      "Per-stylist calendars, services, and commission-ready reports",
      "Automated reminders, review requests, and rebooking prompts",
    ],
  },
  {
    id: "restaurants",
    label: "Restaurants",
    icon: UtensilsCrossed,
    pitch: "Let guests reserve tables that actually exist — with party size and deposits built in.",
    benefits: [
      "Bookable tables with capacity — auto-match party size to seats",
      "Deposits for large parties to protect against no-shows",
      "Guest notes, allergies, and repeat-visitor history in one place",
    ],
  },
  {
    id: "trades",
    label: "Trades",
    icon: Wrench,
    pitch: "Quote, schedule, and get paid — all from one link you send to the customer.",
    benefits: [
      "Time-slot booking with travel buffers between jobs",
      "Take a deposit before a van leaves the yard",
      "Reminders, cancellations, and rescheduling by the client themselves",
    ],
  },
  {
    id: "clinics",
    label: "Clinics",
    icon: Stethoscope,
    pitch: "GDPR-friendly appointment booking with the practitioner and room picker.",
    benefits: [
      "Room and practitioner as bookable resources with real availability",
      "Pre-appointment forms and consent capture on the booking page",
      "SMS and email reminders to cut cancellations",
    ],
  },
  {
    id: "coaches",
    label: "Tutors & Coaches",
    icon: GraduationCap,
    pitch: "Package sessions, sell blocks, and let students book the times you're free.",
    benefits: [
      "Recurring availability and one-off overrides for holidays",
      "Gift codes and referral perks to fill your roster",
      "In-person or online — pick per service and share a link",
    ],
  },
  {
    id: "rentals",
    label: "Rentals & Hire",
    icon: Car,
    pitch: "Hire out cars, vans, tools or venues by the day — with availability that actually blocks the whole booking.",
    benefits: [
      "Switch your calendar to day-based booking instead of hourly slots",
      "Per-day rates with the total calculated across the hire period",
      "Each vehicle or item is a bookable resource, blocked for the full range",
    ],
  },
];

const IndustrySections = () => {
  const [active, setActive] = useState(INDUSTRIES[0].id);
  const current = INDUSTRIES.find(i => i.id === active) ?? INDUSTRIES[0];
  const Icon = current.icon;

  return (
    <section className="px-6 md:px-16 py-16 md:py-20 bg-card/30 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Built for your kind of business</h2>
          <p className="text-muted-foreground text-sm md:text-base">One platform. Configured for how you actually work.</p>
        </div>

        <div className="flex justify-center flex-wrap gap-1.5 mb-8">
          {INDUSTRIES.map(i => {
            const isActive = i.id === active;
            const I = i.icon;
            return (
              <button
                key={i.id}
                onClick={() => setActive(i.id)}
                className={`flex items-center gap-1.5 text-xs md:text-sm font-medium px-3 md:px-4 py-2 rounded-lg border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <I size={14} />
                <span>{i.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-6 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
              <Icon className="text-primary" size={20} />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">{current.label}</h3>
          </div>
          <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-3xl">{current.pitch}</p>
          <ul className="grid gap-3 md:grid-cols-3">
            {current.benefits.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                <Check size={16} className="text-primary shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default IndustrySections;
