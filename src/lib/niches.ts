// Content for the /for/:slug industry landing pages. Only claim features BookSuite really has.

export type Niche = {
  slug: string;
  name: string; // short label, e.g. "Barbers"
  seoTitle: string;
  seoDescription: string;
  headline: string;
  subheadline: string;
  pains: { title: string; body: string }[];
  features: { title: string; body: string }[];
  exampleServices: { name: string; duration: string }[];
  faqs: { q: string; a: string }[];
};

export const NICHES: Niche[] = [
  {
    slug: "barbers",
    name: "Barbers",
    seoTitle: "Barber Booking Software with Deposits & Online Booking — BookSuite",
    seoDescription:
      "Online booking for barbershops: 24/7 appointments, deposits to stop no-shows, automatic reminders and staff rotas for every chair. Try BookSuite free for 30 days.",
    headline: "Barber booking software that keeps every chair full",
    subheadline:
      "Let clients book their fade at 2am, take a deposit so Saturday no-shows stop costing you, and see every barber's day in one place.",
    pains: [
      { title: "Saturday no-shows", body: "An empty chair on your busiest day is money you never get back." },
      { title: "Bookings in your DMs", body: "Replying to Instagram messages between cuts slows everything down." },
      { title: "Juggling several barbers", body: "Keeping track of who's in, who's off and who's free is a full-time job." },
    ],
    features: [
      { title: "Deposits or pay in full", body: "Clients pay upfront when they book, so no-shows don't leave you out of pocket." },
      { title: "Automatic reminders", body: "Clients get a reminder email before their cut — fewer forgotten appointments." },
      { title: "Book with a chosen barber", body: "Each barber has their own schedule and weekly shift pattern." },
      { title: "Link in bio & QR code", body: "Share your booking page on Instagram or print a QR poster for the window." },
      { title: "Waitlist", body: "When you're fully booked, clients join a waitlist instead of going elsewhere." },
      { title: "Reviews", body: "Ask happy clients for a review after their visit." },
    ],
    exampleServices: [
      { name: "Skin fade", duration: "45 min" },
      { name: "Haircut & beard trim", duration: "60 min" },
      { name: "Beard shape-up", duration: "20 min" },
      { name: "Kids' cut", duration: "30 min" },
    ],
    faqs: [
      { q: "Can clients choose which barber they book with?", a: "Yes. Each barber on your team has their own working hours, and bookings are matched to who's actually on shift." },
      { q: "Can I take a deposit for every booking?", a: "Yes. You can ask for a deposit or full payment at the time of booking, paid securely online." },
      { q: "Can I put the booking link on Instagram?", a: "Yes. Every shop gets its own booking page link, plus a QR code and printable poster." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "hair-salons",
    name: "Hair Salons",
    seoTitle: "Hair Salon Booking System with Deposits & Staff Rotas — BookSuite",
    seoDescription:
      "Salon booking software for busy teams: online booking 24/7, deposits for colour appointments, reminders, staff schedules and holiday tracking. 30-day free trial.",
    headline: "Salon booking software built for busy teams",
    subheadline:
      "Take bookings around the clock, secure long colour appointments with a deposit, and manage every stylist's rota and holidays in one place.",
    pains: [
      { title: "Costly colour no-shows", body: "A missed three-hour colour appointment wipes out half a stylist's day." },
      { title: "Phone ringing mid-appointment", body: "Answering calls with foils in means slower service and missed bookings." },
      { title: "Messy rotas and holidays", body: "Spreadsheets and group chats make staff planning painful." },
    ],
    features: [
      { title: "Deposits for long services", body: "Take a deposit or full payment upfront for colour, extensions and treatments." },
      { title: "Stylist schedules", body: "Set each stylist's permanent weekly pattern and change single days as needed." },
      { title: "Holiday allowance tracking", body: "Staff can see how many holiday days they have left; you approve requests." },
      { title: "Automatic reminders", body: "Clients get reminded before their appointment, so fewer forget." },
      { title: "Your salon's look", body: "Add your logo, colours and font to your booking widget on paid plans." },
      { title: "Client portal", body: "Clients can cancel, reschedule or rebook themselves from a secure link." },
    ],
    exampleServices: [
      { name: "Cut & blow dry", duration: "60 min" },
      { name: "Full head colour", duration: "2 hr" },
      { name: "Balayage", duration: "3 hr" },
      { name: "Blow dry", duration: "45 min" },
    ],
    faqs: [
      { q: "Can I take deposits only for some services?", a: "Yes. You choose how payment works for your bookings, so long colour services can be protected with a deposit." },
      { q: "Can my stylists see their own schedule?", a: "Yes. Staff get their own view with today's bookings, upcoming shifts and holiday balance." },
      { q: "Can clients reschedule without calling?", a: "Yes. Clients can manage their own bookings from a secure link sent by email." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "personal-trainers",
    name: "Personal Trainers",
    seoTitle: "Booking Software for Personal Trainers & Fitness Coaches — BookSuite",
    seoDescription:
      "Online booking for personal trainers: clients book sessions 24/7, pay upfront, get reminders and rebook in one tap. Try BookSuite free for 30 days.",
    headline: "Booking software for personal trainers who'd rather be training",
    subheadline:
      "Stop chasing clients over text. Let them book, pay and rebook sessions themselves while you focus on coaching.",
    pains: [
      { title: "Last-minute cancellations", body: "A client bailing an hour before means an unpaid gap in your day." },
      { title: "Endless back-and-forth texts", body: "Finding a time that works shouldn't take ten messages." },
      { title: "Chasing payments", body: "Asking clients to pay after the session is awkward and slow." },
    ],
    features: [
      { title: "Pay when booking", body: "Clients pay a deposit or the full session price online when they book." },
      { title: "Easy rebooking", body: "Clients can rebook their next session from their bookings page in seconds." },
      { title: "Reminders", body: "Automatic reminder emails before every session." },
      { title: "Bookable spaces", body: "Manage studios, rooms or equipment as bookable resources." },
      { title: "Gift codes", body: "Sell gift codes for sessions — great for birthdays and Christmas." },
      { title: "Calendar files", body: "Clients can add their session straight to their phone calendar." },
    ],
    exampleServices: [
      { name: "1-to-1 PT session", duration: "60 min" },
      { name: "Free consultation", duration: "30 min" },
      { name: "Partner session", duration: "60 min" },
      { name: "Online check-in call", duration: "20 min" },
    ],
    faqs: [
      { q: "Can clients pay before the session?", a: "Yes. You can ask for a deposit or full payment at the time of booking." },
      { q: "Can I offer a free consultation?", a: "Yes. Add it as its own service so new clients can book a first chat." },
      { q: "Does it work if I train in different places?", a: "You can set up studios or spaces as bookable resources so the right one is reserved." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "tattoo-artists",
    name: "Tattoo Studios",
    seoTitle: "Tattoo Studio Booking Software with Deposits — BookSuite",
    seoDescription:
      "Booking software for tattoo and piercing studios: take deposits upfront, manage long sessions, artist schedules and waitlists. 30-day free trial.",
    headline: "Tattoo studio booking with deposits built in",
    subheadline:
      "Secure every session with a deposit, block out long sittings properly, and keep each artist's diary organised.",
    pains: [
      { title: "Deposits through bank transfer", body: "Chasing screenshots of transfers before confirming a booking wastes hours." },
      { title: "Long sessions, big losses", body: "A no-show on a full-day sitting is a whole day's income gone." },
      { title: "Busy artists, full diaries", body: "Popular artists get booked out and clients drift away." },
    ],
    features: [
      { title: "Deposits taken online", body: "Clients pay their deposit when they book — no more chasing transfers." },
      { title: "Long or full-day bookings", body: "Set services from short piercings to all-day sessions." },
      { title: "Artist schedules", body: "Each artist has their own working pattern and time off." },
      { title: "Waitlist", body: "Fully booked? Clients join the waitlist and you fill cancellations fast." },
      { title: "Booking requests", body: "Review requests before confirming, with reminders if you forget to reply." },
      { title: "Your studio's look", body: "Match the booking widget to your studio branding on paid plans." },
    ],
    exampleServices: [
      { name: "Consultation", duration: "30 min" },
      { name: "Small tattoo", duration: "1 hr" },
      { name: "Half-day session", duration: "4 hr" },
      { name: "Ear piercing", duration: "20 min" },
    ],
    faqs: [
      { q: "Can I require a deposit for every tattoo?", a: "Yes. Deposits are paid online when the client books." },
      { q: "Can I approve bookings before they're confirmed?", a: "Yes. You can review booking requests, and BookSuite reminds you if one's waiting too long." },
      { q: "Can each artist have their own diary?", a: "Yes. Every artist has their own schedule, shifts and holidays." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "nail-technicians",
    name: "Nail & Lash Techs",
    seoTitle: "Booking App for Nail Technicians & Lash Artists — BookSuite",
    seoDescription:
      "Simple online booking for nail techs and lash artists: Instagram booking link, deposits, reminders and infill rebooking. Try BookSuite free for 30 days.",
    headline: "The booking app for nail techs and lash artists",
    subheadline:
      "Turn your Instagram followers into booked appointments with one link, take a deposit, and keep clients coming back for infills.",
    pains: [
      { title: "Booking through DMs", body: "Answering every 'are you free Friday?' message eats your evenings." },
      { title: "Ghosted appointments", body: "Clients who don't turn up cost you time and product." },
      { title: "Forgetting to rebook", body: "Clients mean to book their infill — then forget until it's too late." },
    ],
    features: [
      { title: "Instagram booking link", body: "One link in your bio takes followers straight to booking." },
      { title: "Deposits", body: "A small deposit at booking means clients actually show up." },
      { title: "One-tap rebooking", body: "Clients rebook their infill or refill from their bookings page." },
      { title: "Reminders", body: "Automatic reminder emails before each appointment." },
      { title: "Reviews", body: "Collect reviews from happy clients to win new ones." },
      { title: "Works solo or with a team", body: "Start on your own and add staff as you grow." },
    ],
    exampleServices: [
      { name: "Gel manicure", duration: "45 min" },
      { name: "BIAB infill", duration: "60 min" },
      { name: "Classic lash set", duration: "90 min" },
      { name: "Lash infill", duration: "60 min" },
    ],
    faqs: [
      { q: "Can I use it if I work alone?", a: "Yes. BookSuite works just as well for one person as for a team." },
      { q: "Can I take a deposit?", a: "Yes. Clients pay a deposit or the full price online when they book." },
      { q: "How do clients find my booking page?", a: "Share your booking link in your Instagram bio, or print the QR code poster for your studio." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
];

export const getNiche = (slug?: string) => NICHES.find((n) => n.slug === slug);
