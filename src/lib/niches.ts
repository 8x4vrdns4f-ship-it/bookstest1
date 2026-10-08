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
  {
    slug: "dog-groomers",
    name: "Dog Groomers",
    seoTitle: "Dog Grooming Booking Software with Deposits & Reminders — BookSuite",
    seoDescription:
      "Online booking for dog groomers and pet salons: 24/7 appointments, deposits to stop no-shows, reminders for owners and easy rebooking. 30-day free trial.",
    headline: "Dog grooming booking software that keeps your table busy",
    subheadline:
      "Let owners book their dog's next groom any time, take a deposit for long full-groom slots, and remind them before every visit.",
    pains: [
      { title: "Owners who don't turn up", body: "A missed two-hour full groom leaves a big gap in your day." },
      { title: "Calls while your hands are full", body: "You can't answer the phone mid-bath with a wet dog on the table." },
      { title: "Clients forgetting the next groom", body: "Coats get matted when owners leave it too long between visits." },
    ],
    features: [
      { title: "Deposits for long grooms", body: "Take a deposit or full payment upfront for full grooms and hand-strips." },
      { title: "Booking notes", body: "Owners can share their dog's name, breed and anything you should know." },
      { title: "Automatic reminders", body: "Owners get a reminder email before the appointment." },
      { title: "Easy rebooking", body: "Owners can book the next groom in a few taps from their bookings page." },
      { title: "Several groomers", body: "Give each groomer their own weekly schedule and time off." },
      { title: "Reviews", body: "Ask happy owners for a review after each visit." },
    ],
    exampleServices: [
      { name: "Full groom (small dog)", duration: "90 min" },
      { name: "Full groom (large dog)", duration: "2 hr 30 min" },
      { name: "Bath & brush", duration: "60 min" },
      { name: "Nail trim", duration: "15 min" },
    ],
    faqs: [
      { q: "Can I set different lengths for small and large dogs?", a: "Yes. Create a separate service for each size, each with its own time and price." },
      { q: "Can I take a deposit?", a: "Yes. Owners pay a deposit or the full price online when they book." },
      { q: "Can owners tell me about their dog when booking?", a: "Yes. They can add notes to the booking so you know what to expect." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "massage-therapists",
    name: "Massage Therapists",
    seoTitle: "Massage & Holistic Therapist Booking Software — BookSuite",
    seoDescription:
      "Booking software for massage, reflexology and holistic therapists: online booking, payment upfront, reminders and treatment rooms. 30-day free trial.",
    headline: "Calm, simple booking for massage and holistic therapists",
    subheadline:
      "Clients book and pay online, get a reminder before their treatment, and you never double-book a treatment room again.",
    pains: [
      { title: "Answering the phone mid-treatment", body: "Interrupting a relaxing session to take a booking ruins the mood." },
      { title: "Late cancellations", body: "A cancelled hour-long treatment is income you rarely fill." },
      { title: "Sharing treatment rooms", body: "Several therapists and limited rooms make double-bookings easy." },
    ],
    features: [
      { title: "Pay when booking", body: "Take a deposit or full payment so cancellations don't cost you." },
      { title: "Treatment rooms", body: "Set up rooms as bookable resources so they're never double-booked." },
      { title: "Reminders", body: "Clients get a reminder email before every treatment." },
      { title: "Gift codes", body: "Sell gift codes — a popular present for massages and treatments." },
      { title: "Client portal", body: "Clients cancel or reschedule themselves from a secure link." },
      { title: "Booking notes", body: "Clients can mention injuries or preferences when they book." },
    ],
    exampleServices: [
      { name: "Deep tissue massage", duration: "60 min" },
      { name: "Hot stone massage", duration: "90 min" },
      { name: "Reflexology", duration: "45 min" },
      { name: "Sports massage", duration: "30 min" },
    ],
    faqs: [
      { q: "Can I manage several treatment rooms?", a: "Yes. Add each room as a bookable resource and BookSuite keeps them from being double-booked." },
      { q: "Can I sell gift vouchers?", a: "Yes. You can create gift codes that clients redeem when they book." },
      { q: "Can clients reschedule themselves?", a: "Yes. Clients get a secure link to cancel, reschedule or rebook." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "lash-brow-artists",
    name: "Lash & Brow Artists",
    seoTitle: "Booking App for Lash & Brow Artists with Deposits — BookSuite",
    seoDescription:
      "Online booking for lash and brow artists: Instagram booking link, deposits, reminders and infill rebooking. Works solo or in a shared studio. 30-day free trial.",
    headline: "Booking for lash and brow artists, straight from your bio",
    subheadline:
      "Turn followers into booked appointments, protect your time with deposits, and keep clients coming back on schedule for infills and tints.",
    pains: [
      { title: "No-shows on full sets", body: "A missed two-hour full set means lost income and wasted prep." },
      { title: "DMs all evening", body: "Booking through messages eats into your time off." },
      { title: "Infills left too long", body: "Clients who forget to rebook end up needing a full set." },
    ],
    features: [
      { title: "Booking link for Instagram", body: "One link in your bio, plus a QR poster for your studio." },
      { title: "Deposits", body: "A deposit at booking means clients take the slot seriously." },
      { title: "Rebook in seconds", body: "Clients book their next infill from their bookings page." },
      { title: "Reminders", body: "Automatic reminder emails before every appointment." },
      { title: "Your own look", body: "Add your logo, colours and font to your booking page on paid plans." },
      { title: "Waitlist", body: "When you're booked up, clients join the waitlist for cancellations." },
    ],
    exampleServices: [
      { name: "Classic full set", duration: "2 hr" },
      { name: "Lash infill", duration: "60 min" },
      { name: "Brow lamination & tint", duration: "45 min" },
      { name: "Lash lift", duration: "60 min" },
    ],
    faqs: [
      { q: "Does it work if I rent a chair in someone else's studio?", a: "Yes. BookSuite works for solo artists with their own booking page." },
      { q: "Can I take a deposit?", a: "Yes. Clients pay a deposit or the full price online when they book." },
      { q: "Can my booking page match my brand?", a: "Yes. On paid plans you can add your logo, colours and font." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "photographers",
    name: "Photographers",
    seoTitle: "Booking Software for Photographers & Photo Studios — BookSuite",
    seoDescription:
      "Online booking for photographers and studios: book shoots 24/7, take deposits upfront, reserve studio space and send reminders. 30-day free trial.",
    headline: "Booking software for photographers and photo studios",
    subheadline:
      "Let clients pick a shoot and pay their deposit online, reserve your studio automatically, and stop losing evenings to booking emails.",
    pains: [
      { title: "Chasing deposits", body: "Shoots aren't secure until money is paid, and chasing it is awkward." },
      { title: "Studio double-bookings", body: "Sharing a studio or set makes clashes easy to miss." },
      { title: "Email ping-pong", body: "Agreeing a date for a shoot takes far too many messages." },
    ],
    features: [
      { title: "Deposits taken online", body: "Clients pay a deposit or the full fee when they book a shoot." },
      { title: "Studios & equipment", body: "Book studios, sets or kit as resources so nothing clashes." },
      { title: "Long sessions", body: "Set shoots from 30-minute headshots to full-day sessions." },
      { title: "Booking requests", body: "Review requests before you confirm a date." },
      { title: "Reminders", body: "Clients are reminded before their shoot." },
      { title: "Gift codes", body: "Sell gift codes for portrait sessions and mini-shoots." },
    ],
    exampleServices: [
      { name: "Headshot session", duration: "30 min" },
      { name: "Family portrait shoot", duration: "60 min" },
      { name: "Product shoot", duration: "3 hr" },
      { name: "Studio hire", duration: "2 hr" },
    ],
    faqs: [
      { q: "Can I approve shoots before they're confirmed?", a: "Yes. Turn on booking requests and confirm each one yourself." },
      { q: "Can I hire out my studio too?", a: "Yes. Add the studio as a bookable resource so it can't be double-booked." },
      { q: "Can I take a deposit for a shoot?", a: "Yes. Deposits are paid online when the client books." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "car-detailing",
    name: "Car Detailing",
    seoTitle: "Car Detailing & Mobile Valeting Booking Software — BookSuite",
    seoDescription:
      "Online booking for car detailers and mobile valeters: customers book 24/7, pay a deposit upfront, get reminders and reschedule easily. 30-day free trial.",
    headline: "Booking software for car detailers and mobile valeters",
    subheadline:
      "Customers pick their valet, pay a deposit and get reminded — while you stay focused on the car in front of you.",
    pains: [
      { title: "Long jobs, big no-shows", body: "An empty half-day ceramic slot is money you can't get back." },
      { title: "Missed calls on the job", body: "You can't answer the phone with a polisher in your hand." },
      { title: "Weather reschedules", body: "Rain means moving bookings, and that means a lot of messages." },
    ],
    features: [
      { title: "Deposits upfront", body: "Take a deposit or full payment for big jobs like ceramic coatings." },
      { title: "Self-service reschedules", body: "Customers move their booking themselves from a secure link." },
      { title: "Booking notes", body: "Customers can add their car model and address when they book." },
      { title: "Reminders", body: "Automatic reminder emails before every job." },
      { title: "Team schedules", body: "Give each detailer their own working pattern." },
      { title: "Reviews", body: "Collect reviews from happy customers to win new work." },
    ],
    exampleServices: [
      { name: "Mini valet", duration: "60 min" },
      { name: "Full valet", duration: "3 hr" },
      { name: "Machine polish", duration: "5 hr" },
      { name: "Ceramic coating", duration: "1 day" },
    ],
    faqs: [
      { q: "Does it work for mobile valeting?", a: "Yes. Customers can add their address and car details in the booking notes." },
      { q: "Can customers reschedule if the weather's bad?", a: "Yes. They can move their booking themselves from a secure link." },
      { q: "Can I take a deposit for ceramic coatings?", a: "Yes. Deposits or full payment are taken online at booking." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "driving-instructors",
    name: "Driving Instructors & Tutors",
    seoTitle: "Booking Software for Driving Instructors & Tutors — BookSuite",
    seoDescription:
      "Online lesson booking for driving instructors and tutors: students book 24/7, pay upfront, get reminders and rebook their next lesson easily. 30-day free trial.",
    headline: "Lesson booking for driving instructors and tutors",
    subheadline:
      "Students book and pay for lessons online, get reminded beforehand, and book their next lesson without a single text.",
    pains: [
      { title: "Last-minute cancellations", body: "A student cancelling an hour before leaves you with an unpaid gap." },
      { title: "Texting about times", body: "Arranging every lesson by message takes up your evenings." },
      { title: "Chasing lesson payments", body: "Collecting money after lessons is slow and awkward." },
    ],
    features: [
      { title: "Pay when booking", body: "Students pay for the lesson, or a deposit, when they book." },
      { title: "Easy rebooking", body: "Students book their next lesson from their bookings page." },
      { title: "Reminders", body: "Automatic reminder emails before every lesson." },
      { title: "Your weekly hours", body: "Set your regular teaching pattern and block off days as needed." },
      { title: "Gift codes", body: "Sell gift codes for lessons — great for birthdays." },
      { title: "Calendar files", body: "Students add lessons straight to their phone calendar." },
    ],
    exampleServices: [
      { name: "Driving lesson", duration: "60 min" },
      { name: "Double lesson", duration: "2 hr" },
      { name: "Maths tutoring", duration: "60 min" },
      { name: "Trial lesson", duration: "30 min" },
    ],
    faqs: [
      { q: "Can students pay before the lesson?", a: "Yes. You can take full payment or a deposit when they book." },
      { q: "Can parents book lessons for their children?", a: "Yes. Anyone can book and add the student's name in the notes." },
      { q: "Can I offer a cheaper first lesson?", a: "Yes. Add a trial lesson as its own service with its own price." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "piercing-studios",
    name: "Piercing Studios",
    seoTitle: "Piercing Studio Booking Software — BookSuite",
    seoDescription:
      "Online booking for piercing studios: quick appointments booked 24/7, deposits, piercer schedules, reminders and reviews. 30-day free trial.",
    headline: "Fast, simple booking for piercing studios",
    subheadline:
      "Fill short appointment slots all day, let clients pick their piercer, and stop no-shows with a small deposit.",
    pains: [
      { title: "Lots of short appointments", body: "Busy days full of 15-minute slots are hard to manage on paper." },
      { title: "Weekend no-shows", body: "Missed slots on Saturdays add up quickly." },
      { title: "Queues at the door", body: "Walk-ins waiting around make the studio feel chaotic." },
    ],
    features: [
      { title: "Short time slots", body: "Set services from 15 minutes, so every gap can be booked." },
      { title: "Deposits", body: "A small deposit makes sure clients turn up." },
      { title: "Choose a piercer", body: "Each piercer has their own schedule and time off." },
      { title: "Reminders", body: "Automatic reminder emails before each appointment." },
      { title: "Link in bio & QR code", body: "Share your booking link online or on a poster in the window." },
      { title: "Reviews", body: "Collect reviews from happy clients." },
    ],
    exampleServices: [
      { name: "Lobe piercing", duration: "15 min" },
      { name: "Helix piercing", duration: "20 min" },
      { name: "Nose piercing", duration: "20 min" },
      { name: "Jewellery change", duration: "10 min" },
    ],
    faqs: [
      { q: "Can I set very short appointments?", a: "Yes. Each service can have its own length, even a few minutes." },
      { q: "Can clients choose their piercer?", a: "Yes. Bookings are matched to piercers who are actually on shift." },
      { q: "Can I take a deposit?", a: "Yes. Clients pay a deposit or the full price online." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
  {
    slug: "rentals",
    name: "Car & Tool Rental",
    seoTitle: "Rental Booking Software for Car, Van & Tool Hire — BookSuite",
    seoDescription:
      "Booking software for car hire, van hire and tool rental: customers book by the day, pay upfront, and every item is tracked so nothing is double-booked. 30-day free trial.",
    headline: "Rental booking software for car, van and tool hire",
    subheadline:
      "Customers pick what they want, choose their days and pay online — and BookSuite makes sure the same car or tool is never booked twice.",
    pains: [
      { title: "Double-booked items", body: "Two customers turning up for the same van is a nightmare." },
      { title: "Tracking who has what", body: "Paper diaries and spreadsheets lose track of what's out and when it's back." },
      { title: "Unpaid hires", body: "Customers who don't pay upfront are more likely to cancel or not turn up." },
    ],
    features: [
      { title: "Book by the day", body: "Customers choose start and end days for multi-day hires." },
      { title: "Every item tracked", body: "Add each car, van or tool as a resource so it can't be double-booked." },
      { title: "Pay upfront", body: "Take a deposit or the full hire cost when they book." },
      { title: "Reminders", body: "Customers are reminded before their pick-up." },
      { title: "Self-service changes", body: "Customers cancel or change dates from a secure link." },
      { title: "Your own look", body: "Brand your booking page with your logo and colours on paid plans." },
    ],
    exampleServices: [
      { name: "Small car hire", duration: "Per day" },
      { name: "Transit van hire", duration: "Per day" },
      { name: "Mini digger hire", duration: "Per day" },
      { name: "Pressure washer hire", duration: "Per day" },
    ],
    faqs: [
      { q: "Can customers book for several days?", a: "Yes. Rentals can be booked by the day, with a start and end date." },
      { q: "How does it stop the same item being booked twice?", a: "Each car, van or tool is set up as its own resource, so once it's booked those days are blocked." },
      { q: "Does it work for both cars and tools?", a: "Yes. Anything you hire out can be added as a bookable item." },
      { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial." },
    ],
  },
];

export const getNiche = (slug?: string) => NICHES.find((n) => n.slug === slug);
