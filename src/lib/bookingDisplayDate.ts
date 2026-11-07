import { format, parseISO } from "date-fns";

/** Display a calendar date without changing its stored or email representation. */
export function bookingDisplayDate(value: string): string {
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? value : format(date, "EEE d MMM yyyy");
}