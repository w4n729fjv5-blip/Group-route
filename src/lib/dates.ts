// Helpers for working with the "YYYY-MM-DD" date strings stored on deliveries.

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Today's date as "YYYY-MM-DD" in the user's local timezone. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse "YYYY-MM-DD" into a local Date (no timezone surprises). */
function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Weekday name for a date string, e.g. "Monday". Empty if unparseable. */
export function weekdayName(iso: string): string {
  const d = parseISO(iso);
  return d ? WEEKDAYS[d.getDay()] : "";
}

/**
 * Friendly label for a day heading, e.g. "Monday, Jun 30" or "Today · Monday".
 * Unparseable / empty dates fall back to "No date".
 */
export function dayLabel(iso: string): string {
  const d = parseISO(iso);
  if (!d) return "No date";
  const weekday = WEEKDAYS[d.getDay()];
  const month = d.toLocaleString(undefined, { month: "short" });
  const base = `${weekday}, ${month} ${d.getDate()}`;
  if (iso === todayISO()) return `Today · ${base}`;
  return base;
}

/** Sort comparator for date strings; empty/"no date" sorts last. */
export function compareDates(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}
