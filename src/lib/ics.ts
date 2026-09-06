interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  durationMinutes: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

const toUtcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

const escapeText = (v: string) => v.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

const eventTimes = (e: CalendarEvent) => {
  const start = new Date(`${e.date}T${e.time.slice(0, 5)}:00`);
  const end = new Date(start.getTime() + (e.durationMinutes || 30) * 60_000);
  return { start, end };
};

export const buildIcs = (e: CalendarEvent): string => {
  const { start, end } = eventTimes(e);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookSuite//Bookings//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@booksuite.online`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(e.title)}`,
    e.description ? `DESCRIPTION:${escapeText(e.description)}` : "",
    e.location ? `LOCATION:${escapeText(e.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
};

export const downloadIcs = (e: CalendarEvent, filename = "booking.ics") => {
  const blob = new Blob([buildIcs(e)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const googleCalendarUrl = (e: CalendarEvent): string => {
  const { start, end } = eventTimes(e);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
    ...(e.description ? { details: e.description } : {}),
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
